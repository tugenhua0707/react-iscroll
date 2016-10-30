//import css from './MsgListPage.css';
import React from 'react';
import iScroll from "iscroll/build/iscroll-probe";
import fetch from 'isomorphic-fetch';

/*
 * 是否需要下拉刷新 通过组件参数 isPullDown 的取值来判断，如果等于1的话，说明需要，等于0的话，说明不需要
 */
export default class MsgListPage extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      items: [],
      pullDownStatus: 3,
      pullUpStatus: 0
    };

    // 当前的页码
    this.page = 1;
    this.itemsChanged = false;
    this.pullDownTips = {
      // 下拉状态
      0: '下拉发起状态',
      1: '继续下拉刷新',
      2: '松手即可刷新',
      3: '正在刷新',
      4: '刷新成功',
    };
    this.pullUpTips = {
      // 上拉状态
      0: '上拉发起加载',
      1: '松手即可加载',
      2: '正在加载',
      3: '加载成功',
    };
    this.isTouching = false;
    this.onItemClicked = this.onItemClicked.bind(this);

    this.onScroll = this.onScroll.bind(this);
    this.onScrollEnd = this.onScrollEnd.bind(this);

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
  }
  componentWillMount() {

    // 是否需要下拉刷新效果
    let isPullDown = this.props.isPullDown - 0;
    this.isPullDown = isPullDown;

    if(!isPullDown) {
      this.setState({
        "pullDownStatus": 4,
        "pullUpStatus": 2
      })
    }
    // 请求的url
    this.url = this.props.url;
  }
  componentDidMount() {
    let me = this;
    const options = {
      // 默认iscroll 会拦截元素的默认事件处理函数，我们需要响应onClick
      preventDefault: false,

      // 禁止缩放
      zoom: false,

      // 是否支持鼠标事件
      mouseWheel: true,

      // 滚动事件的探测灵敏度，1-3，越高越灵敏
      probeType: 3,

      // 拖曳超过上下界后出现动画效果，用于实现上拉/下拉刷新
      bounce: true,

      // 显示滚动条
      scrollbars: true,
    };
    this.iScrollInstance = new iScroll('#ListOutsite',options);
    //console.log(this.iScrollInstance)

    this.iScrollInstance.on('scroll', this.onScroll);
    this.iScrollInstance.on('scrollEnd', this.onScrollEnd);

    this.loadData(true);

  }
  loadData(flag) {
    var me = this;
    if(flag) {
      this.page = 1;
    }
    var url = this.url;
    fetch(url,{
      method: 'get'
    }).then((res) => {
      res.json().then((data) => {
        if(flag && me.isPullDown) {
          // 刷新操作
          if(me.state.pullDownStatus === 3) {
            me.setState({
              pullDownStatus: 4,  
              items: data.data.items
            });

            me.iScrollInstance.scrollTo(0, -1 * document.getElementById("pullDown").offsetHeight,500);
          }
        }else {
          // 加载操作
          if(me.state.pullUpStatus === 2) {
            me.setState({
              pullUpStatus: 0,
              items: me.state.items.concat(data.data.items)
            })
          }
        }
        ++me.page;
        //console.log(`fetchItems=effected isRefresh=${flag}`);
      })
    },function(){
      console.log("加载失败");
    })
  }
  onTouchStart(ev) {
    this.isTouching = true;
  }
  onTouchEnd(ev) {
    this.isTouching = false;
  }
  onItemClicked() {
    // 点击某一项的时候
  }
  // 下拉操作
  onPullDown() {
    // 手势
    if(this.isTouching) {
      // 如果距离大于5的话，提示 松手即可刷新
      if(this.iScrollInstance.y > 5) {
        this.state.pullDownStatus !== 2 && this.setState({pullDownStatus: 2});
      }else {
        // 否则的话，提示 继续下拉刷新
        this.state.pullDownStatus !== 1 && this.setState({pullDownStatus: 1});
      }
    }
  }
  // 上拉操作
  onPullUp() {
    // 手势
    if(this.isTouching) {
      if(this.iScrollInstance.y <= this.iScrollInstance.maxScrollY - 5) {
        // 提示 松手即可加载
        this.state.pullUpStatus !== 1 && this.setState({pullUpStatus: 1});
      }else {
        // 提示上拉发起加载
        this.state.pullUpStatus !== 0 && this.setState({pullUpStatus: 0});
      }
    }
  }
  onScroll() {

    if(this.isPullDown) {
      let h = document.getElementById("pullDown").offsetHeight;
      // 下拉刷新区域
      if(this.iScrollInstance.y > -1 * h) {
        this.onPullDown();
      }else {
        // 提示 下拉发起状态
        this.state.pullDownStatus !== 0 && this.setState({pullDownStatus: 0});
      }
    }
    
    // 上拉区域
    if(this.iScrollInstance.y <= this.iScrollInstance.maxScrollY + 5) {
      this.onPullUp();
    }
  }
  onScrollEnd() {
    //console.log("onScrollEnd" + this.state.pullDownStatus);

    if(this.isPullDown) {
      let h = document.getElementById("pullDown").offsetHeight;
      // 滑动结束后，停在刷新区域
      if(this.iScrollInstance.y > -1 * h) {

        // 如果状态小于或者等于1的话，说明没有发起刷新，那么就弹回去
        if(this.state.pullDownStatus <= 1) {
          this.iScrollInstance.scrollTo(0, -1 * h,200);

        }else if(this.state.pullDownStatus === 2) {
          // 发起了刷新，那么更新状态
          this.setState({pullDownStatus: 3});
          // 发请求
          this.loadData(true);
        }
      }
    }
    
    // 滑动结束后，停在加载区域
    if(this.iScrollInstance.y <= this.iScrollInstance.maxScrollY) {
      // 发起加载，就更新状态
      if(this.state.pullUpStatus === 1) {
        this.setState({pullUpStatus: 2});
        // 发请求
        this.loadData(false);
      }
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    // 如果列表发生了变化，那么应该在 componentDidUpdate时调用iScroll进行刷新
    this.itemsChanged = nextState.items !== this.state.items;
    return true;
  }
  componentDidUpdate() {
    // 紧当列表发生了变化，才会调用iScroll的 refresh 重新计算滚动条的信息
    if(this.itemsChanged) {
      this.iScrollInstance.refresh();
    }
    return true;
  }
  render() {
    let arrs = [];
    this.state.items.map((item,index) => {
      arrs.push(
        <li key={index} onClick = {this.onItemClicked}>
          {item.title}{index}
        </li>
      )
    })
    // 外层容器需要固定的高度，超过该高度，出现滚动条
    return(
      <div id="ListOutsite" className="listOutsite" style={{height: window.innerHeight}} onTouchStart={this.onTouchStart} onTouchEnd={this.onTouchEnd}>
        <div className="listInside">
          {/*<p ref="PullDown" className="pullDown" id="pullDown">{this.pullDownTips[this.state.pullDownStatus]}</p> */}
          <ul>{arrs}</ul>
          <p ref="PullUp" className="pullUp" id="pullUp">{this.pullUpTips[this.state.pullUpStatus]}</p>
        </div>
      </div>
    )
  }
}
