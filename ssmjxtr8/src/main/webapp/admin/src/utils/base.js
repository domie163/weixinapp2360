const base = {
    get() {
                return {
            url : "http://localhost:8080/ssmjxtr8/",
            name: "ssmjxtr8",
            // 退出到首页链接
            indexUrl: 'http://localhost:8080/ssmjxtr8/front/index.html'
        };
            },
    getProjectName(){
        return {
            projectName: "微信点餐小程序"
        } 
    }
}
export default base
