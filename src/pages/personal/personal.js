const storage = require('../../lib/storage');
const apis = require('../../lib/apis');
const util = require('../../lib/util');

const app = getApp();

Page({
  data: {
    version: app.version,
    userInfo: null, // 用户信息
    hasAuthorization: false, // 用户是否授权
    authDeny: null,
    publishBtnStatus: false, // 是否展示回帖
  },
  onShareAppMessage() {
    return {
      title: '足球教练社区-走进足球的世界',
      path: '/pages/index/index',
      imageUrl: 'https://static.zuqiuxunlian.com/16cc9b1362fe39cf91babbbd0bed22c9.jpg'
    }
  },
  onLoad() {},
  onShow() {
    // 获取code
    getLoginCode().then(code => {
      if (code) this.loginCode = code;
    })
    this.setData({ publishBtnStatus: app.globalData.hasPost || false })
    this.initUserAuthStatus();
    storage.get(storage.keys.userInfo).then(user => {
      this.setData({
        userInfo: user ? user : null
      })
    })
  },
  // 退出登录
  logout() {
    wx.showModal({
      title: '温馨提示',
      content: '您确定要退出登录?',
      cancelText: '暂不退出',
      confirmText: '狠心离开',
      success: (res) => {
        if (res.confirm) {
          storage.clear();
          this.setData({ userInfo: null });
          getLoginCode().then(code => { // 刷新code
            if (code) this.loginCode = code;
          })
        } else if (res.cancel) {
          console.log('cancel logout')
        }
      }
    })
  },
  // 用户登录, 获取并存储token; 根据token获取用户信息
  login(data) {
    return wx.fetch({
      url: apis.login,
      method: 'POST',
      data
    }).then(res => {
      if (res && res.success) {
        storage.set(storage.keys.authToken, res.data);
        this.getUserInfoByAuth(res.data);
      }
    })
  },
  // 根据 token 或 accesstoken 获取用户信息;
  // type取值: 'token'或'accesstoken'
  getUserInfoByAuth(code, type = 'token') {
    const url = `${apis.userinfo}?${type}=${code}`;
    wx.fetch({
      url,
      method: 'GET',
      data: {}
    }).then(res => {
      if (res && res.success) {
        storage.set(storage.keys.userInfo, res.data);
        storage.set(storage.keys.accessToken, res.data.accessToken);
        this.setData({
          userInfo: res.data
        });
        wx.hideLoading();
      }
    })
  },
  // 用户授权登录
  handleUserInfoBtn(e) {
    // 用户拒绝授权
    if (!e.detail || !e.detail.userInfo) {
      this.setData({ authDeny: true })
      return;
    }
    wx.showLoading({
      title: '登录中',
      mask: false
    });
    setTimeout(() => {
      wx.hideLoading();
    }, 8000);

    if (this.loginCode) {
      this.login({
        code: this.loginCode,
        authInfo: e.detail
      });
    } else {
      console.error('Login Error, loginCode获取失败');
    }

    // 获取登录code
    // wx.login({
    //   success: (data) => {
    //     if (data.code) {
    //       setTimeout(() => {
    //         this.login({
    //           code: data.code,
    //           authInfo: e.detail
    //         });
    //       }, 500);
    //     } else {
    //       console.log('login fail')
    //     }
    //   }
    // })
  },
  // 获取用户授权状态
  initUserAuthStatus() {
    wx.getSetting({
      success: (res) => {
        this.setData({
          hasAuthorization: !!res.authSetting['scope.userInfo']
        })
      }
    })
  },
  // 跳转个人中心
  toUserInfo() {
    wx.safeNavigateTo({
      url: '/pages/personal/info'
    })
  },
  // 发布话题
  toPost() {
    wx.safeNavigateTo({
      url: '/pages/article/post?type=create'
    })
  },
  // 我的收藏
  toCollection() {
    wx.navigateTo({
      url: '/pages/personal/collection'
    })
  },
  // 我的发帖/我的回复
  toRecent(e) {
    const { type } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/personal/recent?type=${type}`
    })
  },
  // 关于我们
  toAbout() {
    wx.navigateTo({
      url: `/pages/about/about`
    })
  }
})


// 获取登录code
function getLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (data) => {
        if (data.code) {
          resolve(data.code);
        } else {
          resolve(null);
        }
      }
    })
  })
}
