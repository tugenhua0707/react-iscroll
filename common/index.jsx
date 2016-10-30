import React from "react";
import ReactDOM from "react-dom";

// 默认的App根路由，作为组件容器
import Container from "../component/Container";

// 各种小组件在这里引入
import MsgListPage from "../component/MsgListPage/MsgListPage";

ReactDOM.render(
    <MsgListPage isPullDown = "0" url= '../msg-list'/>,
    document.getElementById('reactRoot')
);