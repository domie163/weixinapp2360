<template>
	<mescroll-uni @init="mescrollInit" :up="upOption" :down="downOption" @down="downCallback" @up="upCallback">
		
        <view class="cu-bar bg-white search" :style="[{top:CustomBar + 'px'}]">
			<picker v-if="queryList.length>1" mode="selector" :range="queryList" range-key="queryName" :value="queryIndex" @change="queryChange" style="padding-left: 20upx;">
				<view><image style="width: 20upx;height: 33upx;" src="../../static/center/to.png"></image></view>
			</picker>
			<view v-if="queryIndex==0" class="search-form round">
				<text class="cuIcon-search"></text>
				<input v-model="searchForm.caipinmingcheng" type="text" placeholder="菜品名称" ></input>
			</view>
			<view class="action">
				<button @tap="search" class="cu-btn bg-gradual-green shadow-blur round">搜索</button>
			</view>
		</view>    

	<scroll-view scroll-x="true" class="tabView" :style='{"padding":"8rpx 0","boxShadow":"0 0 12rpx rgba(255,0,0,0)","margin":"0","borderColor":"rgba(0,0,0,1)","backgroundColor":"#e2e2e2","borderRadius":"0","borderWidth":"0","width":"100%","borderStyle":"solid","height":"auto"}'>
        	<view class="tab" v-for="(item,index) in categoryList" :key="index" :class="categoryName===item.caipinfenlei?'tabActive':''" @tap="categoryClick(item.caipinfenlei)">{{item.caipinfenlei}}</view>
        </scroll-view>

		<view class="uni-product-list" :style='{"borderRadius":0,"backgroundColor":"#efefef"}'>
			<view @tap="onDetailTap(product)" class="uni-product" :style='{"borderRadius":"8rpx","backgroundColor":"#fff"}' v-for="(product,index) in list" :key="index">
								                                <view class="uni-product-title" :style='{"fontSize":"28rpx","lineHeight":"56rpx","color":"#333","textAlign":"left"}'>{{product.caipinmingcheng}}</view>
								                				                                <view class="image-view">
                    <image :style='{"borderRadius":"8rpx","width":"100%","height":"100%"}' mode="aspectFill" class="uni-product-image" :src="product.tupian?product.tupian.split(',')[0]:''"></image>
                </view>
                				                				                				                				                				                				                												<view style="display: flex;justify-content: space-between;">
					<text v-if="isAuth('caipinxinxi','修改')" class="cuIcon-edit" @click.stop="onUpdateTap(product.id)">修改</text>
					<text v-if="isAuth('caipinxinxi','删除')" class="cuIcon-delete" @click.stop="onDeleteTap(product.id)">删除</text>
				</view>
			</view>
		</view>
		
		
		<button v-if="isAuth('caipinxinxi','新增')" class="add-btn" @click="onAddTap()">新增</button>
		
	</mescroll-uni>
</template>

<script>
	export default {
		data() {
			return {
				queryList:[
					{
						queryName:"菜品名称",
					},
				],
				queryIndex: 0,
				list: [],
				mescroll: null, //mescroll实例对象
				downOption: {
					auto: false //是否在初始化后,自动执行下拉回调callback; 默认true
				},
				upOption: {
					noMoreSize: 5, //如果列表已无数据,可设置列表的总数量要大于半页才显示无更多数据;避免列表数据过少(比如只有一条数据),显示无更多数据会不好看; 默认5
					textNoMore: '~ 没有更多了 ~',
				},
				hasNext: true,
				searchForm:{},
				categoryList:[],
				categoryName :'全部',
				CustomBar: '0'
			};
		},
		async onShow() {
			let res = await this.$api.list('caipinfenlei', {page:1,limit:100});
			res.data.list.splice(0,0,{id:0,caipinfenlei:'全部'})
			this.categoryList = res.data.list;
			this.hasNext = true
			// 重新加载数据
			if (this.mescroll) this.mescroll.resetUpScroll()
		},
		onLoad() {
			this.hasNext = true
			// 重新加载数据
			if (this.mescroll) this.mescroll.resetUpScroll()
		},
		methods: {
			//查询条件切换
			queryChange(e) {
				this.queryIndex=e.detail.value;
				this.searchForm.caipinmingcheng="";
			},
			//类别搜索
			categoryClick(categoryName){
				this.categoryName = categoryName;
				this.mescroll.resetUpScroll();
			},
			// mescroll组件初始化的回调,可获取到mescroll对象
			mescrollInit(mescroll) {
				this.mescroll = mescroll;
			},
			/*下拉刷新的回调 */
			downCallback(mescroll) {
				this.hasNext = true
				// 重置分页参数页数为1
				mescroll.resetUpScroll()
			},
			/*上拉加载的回调: mescroll携带page的参数, 其中num:当前页 从1开始, size:每页数据条数,默认10 */
			async upCallback(mescroll) {
				let params = {
					page: mescroll.num,
					limit: mescroll.size
				}

				if(this.categoryName!='全部'){
					params.caipinfenlei = '%' + this.categoryName + '%'
				}

				let indexQueryCondition = uni.getStorageSync('indexQueryCondition');
				if(indexQueryCondition) {
					params['caipinmingcheng'] = '%' + indexQueryCondition + '%';
					uni.removeStorageSync('indexQueryCondition');
				}

				let res = await this.$api.list(`caipinxinxi`, params);
				// 如果是第一页数据置空
				if (mescroll.num == 1) this.list = [];
				this.list = this.list.concat(res.data.list);
				if (res.data.list.length == 0) this.hasNext = false;
				mescroll.endSuccess(mescroll.size, this.hasNext);
			},
			// 详情
			onDetailTap(item) {
								this.$utils.jump(`./detail?id=${item.id}`)
							},
			// 修改
			onUpdateTap(id){
				this.$utils.jump(`./add-or-update?id=${id}`)
			},
			// 添加
			onAddTap(){
				this.$utils.jump(`./add-or-update`)
			},
			onDeleteTap(id){
				var _this = this;
				uni.showModal({
					title: '提示',
					content: '是否确认删除',
					success: async function(res) {
						if (res.confirm) {
							await _this.$api.del('caipinxinxi', JSON.stringify([id]));
							_this.hasNext = true
							// 重置分页参数页数为1
							_this.mescroll.resetUpScroll()
						}
					}
				});
			},
			// 搜索
			async search(){
				this.mescroll.num = 1
				let searchForm = {
					page: this.mescroll.num,
					limit: this.mescroll.size
				}
												if(this.searchForm.caipinmingcheng){
					searchForm['caipinmingcheng'] = '%' + this.searchForm.caipinmingcheng + '%'
				}	
																																																																												let res = await this.$api.list(`caipinxinxi`, searchForm);
				// 如果是第一页数据置空
				if (this.mescroll.num == 1) this.list = [];
				this.list = this.list.concat(res.data.list);
				if (res.data.list.length == 0) this.hasNext = false;
				this.mescroll.endSuccess(this.mescroll.size, this.hasNext);
			}
		}
	};
</script>

<style>
	/* product */
	page {
		background: #EEEEEE;
	}

	view {
		font-size: 28upx;
	}
	
	.tabView {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		background: #ffffff;
		height: 60upx;
		margin-bottom: 20upx;
		white-space: nowrap;
		box-shadow: 0px 1px 14px 0px rgba(38, 38, 35, 0.07);
		margin-top: 6upx;
	}
	.tab {
		text-align: center;
		display: inline-block;
		margin: 0 12rpx;
		padding: 0 20rpx;
		width: auto;
		line-height: 68rpx;
		color: #333;
		font-size: 28rpx;
		border-radius: 8rpx;
		border-width: 0;
		border-style: solid;
		border-color: rgba(0,0,0,1);
		background-color: #fff;
		box-shadow: 0 0 12rpx rgba(0,0,0,.3);
	}
	.tabActive{
		margin: 0 12rpx;
		padding: 0 28rpx;
		width: auto;
		line-height: 68rpx;
		color: #fff;
		font-size: 28rpx;
		border-radius: 8rpx;
		border-width: 0;
		border-style: solid;
		border-color: rgba(0,0,0,1);
		background-color: #333;
		box-shadow: 0 0 12rpx rgba(0,0,0,.3);
	}
	.tab:last-of-type {
		border: none;
	}

	.uni-product-list {
		display: flex;
		width: 100%;
		flex-wrap: wrap;
		flex-direction: row;
		margin-top: 0upx;
		justify-content: space-around;
	}

	.uni-product {
		padding: 10upx;
		margin: 10upx;
		display: flex;
		flex-direction: column;
		background: #FFFFFF;
	}

	.image-view {
		height: 330upx;
		width: 330upx;
		margin: 12upx 0;
	}

	.uni-product-image {
		height: 330upx;
		width: 330upx;
	}

	.uni-product-title {
		width: 300upx;
		word-break: break-all;
		display: -webkit-box;
		overflow: hidden;
		line-height: 1.5;
		text-overflow: ellipsis;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	.uni-product-price {
		margin-top: 10upx;
		font-size: 28upx;
		line-height: 1.5;
		position: relative;
	}

	.uni-product-price-original {
		color: #e80080;
	}

	.uni-product-price-favour {
		color: #888888;
		text-decoration: line-through;
		margin-left: 10upx;
	}

	.uni-product-tip {
		position: absolute;
		right: 10upx;
		background-color: #ff3333;
		color: #ffffff;
		padding: 0 10upx;
		border-radius: 5upx;
	}

	uni-image > div, uni-image > img {
		width: 100%;
		height: 140px;
		object-fit: cover;
	}

	.add-btn {
		position: fixed;
		left: 30upx;
		right: 30upx;
		// #ifndef MP
		bottom: 106upx;
		// #endif
		// #ifdef MP-WEIXIN
		bottom: 16upx;
		// #endif
		z-index: 95;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 690upx;
		height: 80upx;
		font-size: 32upx;
		color: #fff;
		background-color: red;
		border-radius: 10upx;
		box-shadow: 1px 2px 5px rgba(219, 63, 96, 0.4);
	}
	
	.list {
		padding: 20upx 20upx 20upx;
	}
	
	.listm {
		background: #fff;
		border-radius: 15upx;
		box-shadow: 0 0 2upx rgba(0, 0, 0, 0.1);
		margin-bottom: 20upx;
		padding: 30upx;
	}
	
	.listmpic {
		border-radius: 10upx;
		width: 166upx;
		margin-right: 20upx;
	}
	
	.listmr {
		// width: 460upx;
		display: inline-block;
		flex: 1;
		display: flex;
		justify-content: space-between;
		flex-direction: column;
	}
</style>
