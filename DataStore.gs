/** ============================================================
 * DataStore.gs
 *
 * 集中管理 AA01 使用的外部資源識別碼與桃園市長照給付
 * 資料庫靜態資料。所有伺服端模組皆從此處取得設定或
 * 參考資料，以確保來源一致且容易維護。
 * ============================================================ */

const TEMPLATE_DOC_ID   = '1xPMnoX6VvE46mHPEtEpUx1vq86ZSM9A123N_DKhlaWI';
const OUTPUT_FOLDER_ID  = '1nzWSaZDP2z7ARiWCSZ5j6mSAwhWYIQBO';
const MANAGERS_SHEET_ID = '1O5VcGEKycT396zP5Am2CFmUux9I3Hc7yRX77wrNthfA';
const MANAGERS_SHEET_NAME = '工作表3';
const CONSULTANTS_BOOK_ID  = '1GIkHN7Yz2rEhs0djFH4nm3ZsIHR6n_iXz2Nf9XZe1yg';
const CONSULTANTS_BOOK_NAME = '照專名單';

/** 桃園市長照給付資料庫（v1）常用資料表 */
const TAOYUAN_LTC_DATA = {
  "needLevelsCaps": [
    {
      "needLevel": 2,
      "bcMonthlyCap": 10020,
      "dCategory1Cap": 1680,
      "dCategory2Cap": 1840,
      "dCategory3Cap": 2000,
      "dCategory4Cap": 2400,
      "efThreeYearCap": 40000,
      "gAnnualCap": 32340
    },
    {
      "needLevel": 3,
      "bcMonthlyCap": 15460,
      "dCategory1Cap": 1680,
      "dCategory2Cap": 1840,
      "dCategory3Cap": 2000,
      "dCategory4Cap": 2400,
      "efThreeYearCap": 40000,
      "gAnnualCap": 32340
    },
    {
      "needLevel": 4,
      "bcMonthlyCap": 18580,
      "dCategory1Cap": 1680,
      "dCategory2Cap": 1840,
      "dCategory3Cap": 2000,
      "dCategory4Cap": 2400,
      "efThreeYearCap": 40000,
      "gAnnualCap": 32340
    },
    {
      "needLevel": 5,
      "bcMonthlyCap": 24100,
      "dCategory1Cap": 1680,
      "dCategory2Cap": 1840,
      "dCategory3Cap": 2000,
      "dCategory4Cap": 2400,
      "efThreeYearCap": 40000,
      "gAnnualCap": 32340
    },
    {
      "needLevel": 6,
      "bcMonthlyCap": 28070,
      "dCategory1Cap": 1680,
      "dCategory2Cap": 1840,
      "dCategory3Cap": 2000,
      "dCategory4Cap": 2400,
      "efThreeYearCap": 40000,
      "gAnnualCap": 32340
    },
    {
      "needLevel": 7,
      "bcMonthlyCap": 32090,
      "dCategory1Cap": 1680,
      "dCategory2Cap": 1840,
      "dCategory3Cap": 2000,
      "dCategory4Cap": 2400,
      "efThreeYearCap": 40000,
      "gAnnualCap": 48510
    },
    {
      "needLevel": 8,
      "bcMonthlyCap": 36180,
      "dCategory1Cap": 1680,
      "dCategory2Cap": 1840,
      "dCategory3Cap": 2000,
      "dCategory4Cap": 2400,
      "efThreeYearCap": 40000,
      "gAnnualCap": 48510
    }
  ],
  "transportAllowanceCategories": [
    {
      "principle": "縣市幅員",
      "category": "第一類",
      "area": "未達五百平方公里",
      "region": "嘉義市"
    },
    {
      "principle": "縣市幅員",
      "category": "第一類",
      "area": "未達五百平方公里",
      "region": "新竹市"
    },
    {
      "principle": "縣市幅員",
      "category": "第一類",
      "area": "未達五百平方公里",
      "region": "基隆市"
    },
    {
      "principle": "縣市幅員",
      "category": "第一類",
      "area": "未達五百平方公里",
      "region": "臺北市"
    },
    {
      "principle": "縣市幅員",
      "category": "第二類",
      "area": "五百平方公里以上， 未達二千五百平方公 里",
      "region": "彰化縣"
    },
    {
      "principle": "縣市幅員",
      "category": "第二類",
      "area": "五百平方公里以上， 未達二千五百平方公 里",
      "region": "桃園市"
    },
    {
      "principle": "縣市幅員",
      "category": "第二類",
      "area": "五百平方公里以上， 未達二千五百平方公 里",
      "region": "雲林縣"
    },
    {
      "principle": "縣市幅員",
      "category": "第二類",
      "area": "五百平方公里以上， 未達二千五百平方公 里",
      "region": "新竹縣"
    },
    {
      "principle": "縣市幅員",
      "category": "第二類",
      "area": "五百平方公里以上， 未達二千五百平方公 里",
      "region": "苗栗縣"
    },
    {
      "principle": "縣市幅員",
      "category": "第二類",
      "area": "五百平方公里以上， 未達二千五百平方公 里",
      "region": "嘉義縣"
    },
    {
      "principle": "縣市幅員",
      "category": "第二類",
      "area": "五百平方公里以上， 未達二千五百平方公 里",
      "region": "新北市"
    },
    {
      "principle": "縣市幅員",
      "category": "第二類",
      "area": "五百平方公里以上， 未達二千五百平方公 里",
      "region": "宜蘭縣"
    },
    {
      "principle": "縣市幅員",
      "category": "第二類",
      "area": "五百平方公里以上， 未達二千五百平方公 里",
      "region": "臺南市"
    },
    {
      "principle": "縣市幅員",
      "category": "第二類",
      "area": "五百平方公里以上， 未達二千五百平方公 里",
      "region": "臺中市"
    },
    {
      "principle": "縣市幅員",
      "category": "第三類",
      "area": "二千五百平方公里以上",
      "region": "屏東縣"
    },
    {
      "principle": "縣市幅員",
      "category": "第三類",
      "area": "二千五百平方公里以上",
      "region": "高雄市"
    },
    {
      "principle": "縣市幅員",
      "category": "第三類",
      "area": "二千五百平方公里以上",
      "region": "南投縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠縣市",
      "region": "臺東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠縣市",
      "region": "花蓮縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠縣市",
      "region": "澎湖縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠縣市",
      "region": "金門縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠縣市",
      "region": "連江縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "新北市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "新北市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "新北市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "新北市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "新北市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "新北市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "桃園市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "臺南市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "臺南市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "臺南市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "臺南市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "新竹縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "新竹縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "新竹縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "新竹縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "苗栗縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "苗栗縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "苗栗縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "苗栗縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "臺中市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "南投縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "南投縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "南投縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "南投縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "南投縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "南投縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "嘉義縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "嘉義縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "嘉義縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "高雄市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "高雄市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "高雄市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "高雄市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "高雄市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "高雄市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "高雄市"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "屏東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "屏東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "屏東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "屏東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "屏東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "屏東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "屏東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "屏東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "屏東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "屏東縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "宜蘭縣"
    },
    {
      "principle": "偏遠地區",
      "category": "第四類",
      "area": "偏遠鄉鎮市區",
      "region": "宜蘭縣"
    }
  ],
  "remoteAreaScopes": [
    {
      "category": "離島",
      "county": "屏東縣",
      "district": "琉球鄉"
    },
    {
      "category": "離島",
      "county": "臺東縣",
      "district": "綠島鄉"
    },
    {
      "category": "離島",
      "county": "澎湖縣",
      "district": "馬公市"
    },
    {
      "category": "離島",
      "county": "澎湖縣",
      "district": "湖西鄉"
    },
    {
      "category": "離島",
      "county": "澎湖縣",
      "district": "白沙鄉"
    },
    {
      "category": "離島",
      "county": "澎湖縣",
      "district": "西嶼鄉"
    },
    {
      "category": "離島",
      "county": "澎湖縣",
      "district": "望安鄉"
    },
    {
      "category": "離島",
      "county": "澎湖縣",
      "district": "七美鄉"
    },
    {
      "category": "離島",
      "county": "金門縣",
      "district": "金城鎮"
    },
    {
      "category": "離島",
      "county": "金門縣",
      "district": "金寧鄉"
    },
    {
      "category": "離島",
      "county": "金門縣",
      "district": "金沙鎮"
    },
    {
      "category": "離島",
      "county": "金門縣",
      "district": "烈嶼鄉"
    },
    {
      "category": "離島",
      "county": "金門縣",
      "district": "金湖鎮"
    },
    {
      "category": "離島",
      "county": "金門縣",
      "district": "烏坵鄉"
    },
    {
      "category": "離島",
      "county": "連江縣",
      "district": "南竿鄉"
    },
    {
      "category": "離島",
      "county": "連江縣",
      "district": "北竿鄉"
    },
    {
      "category": "離島",
      "county": "連江縣",
      "district": "莒光鄉"
    },
    {
      "category": "離島",
      "county": "連江縣",
      "district": "東引鄉"
    },
    {
      "category": "原民區",
      "county": "新北市",
      "district": "烏來區"
    },
    {
      "category": "原民區",
      "county": "桃園市",
      "district": "復興區"
    },
    {
      "category": "原民區",
      "county": "新竹縣",
      "district": "五峰鄉"
    },
    {
      "category": "原民區",
      "county": "新竹縣",
      "district": "尖石鄉"
    },
    {
      "category": "原民區",
      "county": "新竹縣",
      "district": "關西鎮"
    },
    {
      "category": "原民區",
      "county": "苗栗縣",
      "district": "泰安鄉"
    },
    {
      "category": "原民區",
      "county": "苗栗縣",
      "district": "南庄鄉"
    },
    {
      "category": "原民區",
      "county": "苗栗縣",
      "district": "獅潭鄉"
    },
    {
      "category": "原民區",
      "county": "臺中市",
      "district": "和平區"
    },
    {
      "category": "原民區",
      "county": "南投縣",
      "district": "仁愛鄉"
    },
    {
      "category": "原民區",
      "county": "南投縣",
      "district": "信義鄉"
    },
    {
      "category": "原民區",
      "county": "南投縣",
      "district": "魚池鄉"
    },
    {
      "category": "原民區",
      "county": "嘉義縣",
      "district": "阿里山鄉"
    },
    {
      "category": "原民區",
      "county": "高雄市",
      "district": "那瑪夏區"
    },
    {
      "category": "原民區",
      "county": "高雄市",
      "district": "桃源區"
    },
    {
      "category": "原民區",
      "county": "高雄市",
      "district": "茂林區"
    },
    {
      "category": "原民區",
      "county": "屏東縣",
      "district": "三地門鄉"
    },
    {
      "category": "原民區",
      "county": "屏東縣",
      "district": "霧臺鄉"
    },
    {
      "category": "原民區",
      "county": "屏東縣",
      "district": "瑪家鄉"
    },
    {
      "category": "原民區",
      "county": "屏東縣",
      "district": "泰武鄉"
    },
    {
      "category": "原民區",
      "county": "屏東縣",
      "district": "來義鄉"
    },
    {
      "category": "原民區",
      "county": "屏東縣",
      "district": "春日鄉"
    },
    {
      "category": "原民區",
      "county": "屏東縣",
      "district": "獅子鄉"
    },
    {
      "category": "原民區",
      "county": "屏東縣",
      "district": "牡丹鄉"
    },
    {
      "category": "原民區",
      "county": "宜蘭縣",
      "district": "大同鄉"
    },
    {
      "category": "原民區",
      "county": "宜蘭縣",
      "district": "南澳鄉"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "秀林鄉"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "萬榮鄉"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "卓溪鄉"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "花蓮市"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "吉安鄉"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "新城鄉"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "壽豐鄉"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "鳳林鎮"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "光復鄉"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "豐濱鄉"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "瑞穗鄉"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "玉里鎮"
    },
    {
      "category": "原民區",
      "county": "花蓮縣",
      "district": "富里鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "海端鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "延平鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "金峰鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "達仁鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "蘭嶼鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "臺東市"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "卑南鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "大武鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "太麻里鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "東河鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "鹿野鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "池上鄉"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "成功鎮"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "關山鎮"
    },
    {
      "category": "原民區",
      "county": "臺東縣",
      "district": "長濱鄉"
    }
  ],
  "policyIncentives": [
    {
      "code": "AA03",
      "name": "照顧服務員配合專業服務",
      "price": 600,
      "remotePrice": 720,
      "unit": "次",
      "note": "不扣額度，免部分負擔"
    },
    {
      "code": "AA04",
      "name": "於臨終日提供服務加計",
      "price": 1200,
      "remotePrice": 1440,
      "unit": "次",
      "note": "不扣額度，免部分負擔"
    },
    {
      "code": "AA05",
      "name": "照顧困難之服務加計",
      "price": 200,
      "remotePrice": 240,
      "unit": "日",
      "note": "不扣額度，免部分負擔"
    },
    {
      "code": "AA06",
      "name": "身體照顧困難加計",
      "price": 200,
      "remotePrice": 240,
      "unit": "日",
      "note": "不扣額度，免部分負擔"
    },
    {
      "code": "AA07",
      "name": "家庭照顧功能微弱之服務加計",
      "price": 760,
      "remotePrice": 915,
      "unit": "月",
      "note": "不扣額度，免部分負擔"
    },
    {
      "code": "AA08",
      "name": "晚間服務加計",
      "price": 385,
      "remotePrice": 465,
      "unit": "日",
      "note": "不扣額度，免部分負擔"
    },
    {
      "code": "AA09",
      "name": "例假日服務加計",
      "price": 770,
      "remotePrice": 925,
      "unit": "日",
      "note": "不扣額度，免部分負擔"
    },
    {
      "code": "AA10",
      "name": "夜間緊急服務加計",
      "price": 1000,
      "remotePrice": 1200,
      "unit": "次",
      "note": "不扣額度，免部分負擔"
    },
    {
      "code": "AA11",
      "name": "照顧服務員進階訓練加計",
      "price": 50,
      "remotePrice": 60,
      "unit": "日",
      "note": "不扣額度，免部分負擔"
    }
  ],
  "careManagement": [
    {
      "code": "AA01",
      "name": "照顧計畫擬訂與服務連結",
      "price": 1700,
      "remotePrice": 2040,
      "unit": "次",
      "note": "不扣額度，免部分負擔"
    },
    {
      "code": "AA02",
      "name": "照顧管理",
      "price": 400,
      "remotePrice": 480,
      "unit": "次",
      "note": "不扣額度，免部分負擔"
    }
  ],
  "homeCare": [
    {
      "code": "BA01",
      "name": "基本身體清潔",
      "price": 260,
      "remotePrice": 310,
      "unit": "次",
      "note": "可臨時提供"
    },
    {
      "code": "BA02",
      "name": "基本日常照顧",
      "price": 195,
      "remotePrice": 235,
      "unit": "30分鐘",
      "note": "一日上限3小時"
    },
    {
      "code": "BA03",
      "name": "測量生命徵象",
      "price": 35,
      "remotePrice": 40,
      "unit": "次",
      "note": ""
    },
    {
      "code": "BA04",
      "name": "協助進食或管灌餵食",
      "price": 130,
      "remotePrice": 155,
      "unit": "餐",
      "note": ""
    },
    {
      "code": "BA05",
      "name": "餐食照顧",
      "price": 310,
      "remotePrice": 370,
      "unit": "次",
      "note": ""
    },
    {
      "code": "BA07",
      "name": "協助沐浴及洗頭",
      "price": 325,
      "remotePrice": 385,
      "unit": "次",
      "note": "可臨時提供"
    },
    {
      "code": "BA08",
      "name": "足部照護",
      "price": 500,
      "remotePrice": 600,
      "unit": "次",
      "note": "需完成認可訓練之人員提供"
    },
    {
      "code": "BA09",
      "name": "到宅沐浴車服務—第一型",
      "price": 2200,
      "remotePrice": 2640,
      "unit": "次",
      "note": "至少3位照顧服務員"
    },
    {
      "code": "BA09a",
      "name": "到宅沐浴車服務—第二型",
      "price": 2500,
      "remotePrice": 3000,
      "unit": "次",
      "note": "至少1護理+2照服員"
    },
    {
      "code": "BA10",
      "name": "翻身拍背",
      "price": 155,
      "remotePrice": 190,
      "unit": "次",
      "note": ""
    },
    {
      "code": "BA11",
      "name": "肢體關節活動",
      "price": 195,
      "remotePrice": 235,
      "unit": "次",
      "note": ""
    },
    {
      "code": "BA12",
      "name": "協助上(下)樓梯",
      "price": 130,
      "remotePrice": 155,
      "unit": "次",
      "note": "可臨時提供"
    },
    {
      "code": "BA13",
      "name": "陪同外出",
      "price": 195,
      "remotePrice": 235,
      "unit": "30分鐘",
      "note": ""
    },
    {
      "code": "BA14",
      "name": "陪同就醫",
      "price": 685,
      "remotePrice": 825,
      "unit": "次",
      "note": "可超1.5小時續用BA13；可臨時提供"
    },
    {
      "code": "BA15",
      "name": "家務協助",
      "price": 195,
      "remotePrice": 235,
      "unit": "30分鐘",
      "note": "獨居/非獨居差異與50%規則"
    },
    {
      "code": "BA16",
      "name": "代購或代領或代送服務",
      "price": 130,
      "remotePrice": 155,
      "unit": "次",
      "note": "5公里以內；50%規則"
    },
    {
      "code": "BA17a",
      "name": "人工氣道管內分泌物抽吸",
      "price": 75,
      "remotePrice": 90,
      "unit": "次",
      "note": "可臨時提供"
    },
    {
      "code": "BA17b",
      "name": "口腔內分泌物抽吸",
      "price": 65,
      "remotePrice": 80,
      "unit": "次",
      "note": "可臨時提供"
    },
    {
      "code": "BA17c",
      "name": "尿管及鼻胃管之清潔與固定",
      "price": 50,
      "remotePrice": 60,
      "unit": "次",
      "note": "可臨時提供（限頻次）"
    },
    {
      "code": "BA17d1",
      "name": "血糖機驗血糖",
      "price": 50,
      "remotePrice": 60,
      "unit": "次",
      "note": "可臨時提供（每日1次）"
    },
    {
      "code": "BA17d2",
      "name": "甘油球通便",
      "price": 50,
      "remotePrice": 60,
      "unit": "次",
      "note": "可臨時提供（每週3次）"
    },
    {
      "code": "BA17e",
      "name": "依指示置入藥盒",
      "price": 50,
      "remotePrice": 60,
      "unit": "次",
      "note": "每週1次"
    },
    {
      "code": "BA18",
      "name": "安全看視",
      "price": 200,
      "remotePrice": 240,
      "unit": "30分鐘",
      "note": "心智障礙者專用"
    },
    {
      "code": "BA20",
      "name": "陪伴服務",
      "price": 175,
      "remotePrice": 210,
      "unit": "30分鐘",
      "note": ""
    },
    {
      "code": "BA22",
      "name": "巡視服務",
      "price": 130,
      "remotePrice": 160,
      "unit": "日",
      "note": "不得搭配其他組合"
    },
    {
      "code": "BA23",
      "name": "協助洗頭",
      "price": 200,
      "remotePrice": 240,
      "unit": "次",
      "note": "可臨時提供"
    },
    {
      "code": "BA24",
      "name": "協助排泄",
      "price": 220,
      "remotePrice": 265,
      "unit": "次",
      "note": "可臨時提供"
    }
  ],
  "dayCare": [
    {
      "code": "BB01",
      "name": "日間照顧（全日）—第一型",
      "price": 675,
      "remotePrice": 810,
      "unit": "日",
      "note": "需等級2"
    },
    {
      "code": "BB02",
      "name": "日間照顧（半日）—第一型",
      "price": 340,
      "remotePrice": 405,
      "unit": "半日",
      "note": "需等級2"
    },
    {
      "code": "BB03",
      "name": "日間照顧（全日）—第二型",
      "price": 840,
      "remotePrice": 1005,
      "unit": "日",
      "note": "需等級3"
    },
    {
      "code": "BB04",
      "name": "日間照顧（半日）—第二型",
      "price": 420,
      "remotePrice": 505,
      "unit": "半日",
      "note": "需等級3"
    },
    {
      "code": "BB05",
      "name": "日間照顧（全日）—第三型",
      "price": 920,
      "remotePrice": 1105,
      "unit": "日",
      "note": "需等級4"
    },
    {
      "code": "BB06",
      "name": "日間照顧（半日）—第三型",
      "price": 460,
      "remotePrice": 555,
      "unit": "半日",
      "note": "需等級4"
    },
    {
      "code": "BB07",
      "name": "日間照顧（全日）—第四型",
      "price": 1045,
      "remotePrice": 1255,
      "unit": "日",
      "note": "需等級5"
    },
    {
      "code": "BB08",
      "name": "日間照顧（半日）—第四型",
      "price": 525,
      "remotePrice": 630,
      "unit": "半日",
      "note": "需等級5"
    },
    {
      "code": "BB09",
      "name": "日間照顧（全日）—第五型",
      "price": 1130,
      "remotePrice": 1355,
      "unit": "日",
      "note": "需等級6"
    },
    {
      "code": "BB10",
      "name": "日間照顧（半日）—第五型",
      "price": 565,
      "remotePrice": 680,
      "unit": "半日",
      "note": "需等級6"
    },
    {
      "code": "BB11",
      "name": "日間照顧（全日）—第六型",
      "price": 1210,
      "remotePrice": 1450,
      "unit": "日",
      "note": "需等級7"
    },
    {
      "code": "BB12",
      "name": "日間照顧（半日）—第六型",
      "price": 605,
      "remotePrice": 725,
      "unit": "半日",
      "note": "需等級7"
    },
    {
      "code": "BB13",
      "name": "日間照顧（全日）—第七型",
      "price": 1285,
      "remotePrice": 1540,
      "unit": "日",
      "note": "需等級8"
    },
    {
      "code": "BB14",
      "name": "日間照顧（半日）—第七型",
      "price": 645,
      "remotePrice": 770,
      "unit": "半日",
      "note": "需等級8"
    },
    {
      "code": "BD01",
      "name": "社區式協助沐浴",
      "price": 200,
      "remotePrice": 240,
      "unit": "次",
      "note": "日照/小規模多機能或托顧家庭提供"
    },
    {
      "code": "BD02",
      "name": "社區式晚餐",
      "price": 150,
      "remotePrice": 180,
      "unit": "次",
      "note": "日照/小規模多機能或托顧家庭提供"
    },
    {
      "code": "BD03",
      "name": "社區式服務交通接送",
      "price": 100,
      "remotePrice": 120,
      "unit": "趟",
      "note": "10公里內；聘有職業駕照"
    }
  ],
  "familyCare": [
    {
      "code": "BC01",
      "name": "家庭托顧（全日）—第一型",
      "price": 625,
      "remotePrice": 750,
      "unit": "日",
      "note": "需等級2"
    },
    {
      "code": "BC02",
      "name": "家庭托顧（半日）—第一型",
      "price": 315,
      "remotePrice": 375,
      "unit": "半日",
      "note": "需等級2"
    },
    {
      "code": "BC03",
      "name": "家庭托顧（全日）—第二型",
      "price": 760,
      "remotePrice": 915,
      "unit": "日",
      "note": "需等級3"
    },
    {
      "code": "BC04",
      "name": "家庭托顧（半日）—第二型",
      "price": 380,
      "remotePrice": 460,
      "unit": "半日",
      "note": "需等級3"
    },
    {
      "code": "BC05",
      "name": "家庭托顧（全日）—第三型",
      "price": 785,
      "remotePrice": 945,
      "unit": "日",
      "note": "需等級4"
    },
    {
      "code": "BC06",
      "name": "家庭托顧（半日）—第三型",
      "price": 395,
      "remotePrice": 475,
      "unit": "半日",
      "note": "需等級4"
    },
    {
      "code": "BC07",
      "name": "家庭托顧（全日）—第四型",
      "price": 880,
      "remotePrice": 1055,
      "unit": "日",
      "note": "需等級5"
    },
    {
      "code": "BC08",
      "name": "家庭托顧（半日）—第四型",
      "price": 440,
      "remotePrice": 530,
      "unit": "半日",
      "note": "需等級5"
    },
    {
      "code": "BC09",
      "name": "家庭托顧（全日）—第五型",
      "price": 960,
      "remotePrice": 1155,
      "unit": "日",
      "note": "需等級6"
    },
    {
      "code": "BC10",
      "name": "家庭托顧（半日）—第五型",
      "price": 480,
      "remotePrice": 580,
      "unit": "半日",
      "note": "需等級6"
    },
    {
      "code": "BC11",
      "name": "家庭托顧（全日）—第六型",
      "price": 980,
      "remotePrice": 1180,
      "unit": "日",
      "note": "需等級7"
    },
    {
      "code": "BC12",
      "name": "家庭托顧（半日）—第六型",
      "price": 490,
      "remotePrice": 590,
      "unit": "半日",
      "note": "需等級7"
    },
    {
      "code": "BC13",
      "name": "家庭托顧（全日）—第七型",
      "price": 1040,
      "remotePrice": 1250,
      "unit": "日",
      "note": "需等級8"
    },
    {
      "code": "BC14",
      "name": "家庭托顧（半日）—第七型",
      "price": 520,
      "remotePrice": 625,
      "unit": "半日",
      "note": "需等級8"
    },
    {
      "code": "BD01",
      "name": "社區式協助沐浴",
      "price": 200,
      "remotePrice": 240,
      "unit": "次",
      "note": "日照/小規模多機能或托顧家庭提供"
    },
    {
      "code": "BD02",
      "name": "社區式晚餐",
      "price": 150,
      "remotePrice": 180,
      "unit": "次",
      "note": "日照/小規模多機能或托顧家庭提供"
    },
    {
      "code": "BD03",
      "name": "社區式服務交通接送",
      "price": 100,
      "remotePrice": 120,
      "unit": "趟",
      "note": "10公里內；聘有職業駕照"
    }
  ],
  "professionalServices": [
    {
      "code": "CA07",
      "name": "IADLs/ADLs 復能照護",
      "price": 4500,
      "remotePrice": 5400,
      "unit": "組",
      "note": "三次措施為一單位"
    },
    {
      "code": "CA08",
      "name": "個別化服務計畫（ISP）擬定與執行",
      "price": 6000,
      "remotePrice": 7200,
      "unit": "組",
      "note": "四次措施為一單位"
    },
    {
      "code": "CB01",
      "name": "營養照護",
      "price": 4000,
      "remotePrice": 4800,
      "unit": "組",
      "note": "四次措施為一單位"
    },
    {
      "code": "CB02",
      "name": "進食與吞嚥照護",
      "price": 9000,
      "remotePrice": 10800,
      "unit": "組",
      "note": "六次措施為一單位"
    },
    {
      "code": "CB03",
      "name": "困擾行為照護",
      "price": 4500,
      "remotePrice": 5400,
      "unit": "組",
      "note": "三次措施為一單位"
    },
    {
      "code": "CB04",
      "name": "臥床或長期活動受限照護",
      "price": 9000,
      "remotePrice": 10800,
      "unit": "組",
      "note": "六次措施為一單位"
    },
    {
      "code": "CC01",
      "name": "居家環境安全/無障礙空間規劃",
      "price": 2000,
      "remotePrice": 2400,
      "unit": "組",
      "note": "二次措施為一單位"
    },
    {
      "code": "CD02",
      "name": "居家護理指導與諮詢",
      "price": 6000,
      "remotePrice": 7200,
      "unit": "組",
      "note": "三次措施+一次評值"
    }
  ],
  "transportServices": [
    {
      "code": "DA01",
      "name": "交通接送（就醫/復健/透析）",
      "price": 1840,
      "remotePrice": null,
      "unit": "次",
      "note": ""
    }
  ],
  "respiteServices": [
    {
      "code": "GA03",
      "name": "日間照顧中心喘息—全日",
      "price": 1250,
      "remotePrice": 1500,
      "unit": "日",
      "note": "含交通接送"
    },
    {
      "code": "GA04",
      "name": "日間照顧中心喘息—半日",
      "price": 625,
      "remotePrice": 750,
      "unit": "半日",
      "note": "含交通接送"
    },
    {
      "code": "GA05",
      "name": "機構住宿式喘息服務",
      "price": 2310,
      "remotePrice": 2775,
      "unit": "日(24小時)",
      "note": "含交通接送"
    },
    {
      "code": "GA06",
      "name": "小規模多機能—夜間喘息",
      "price": 2000,
      "remotePrice": 2400,
      "unit": "次",
      "note": "夜間18:00-翌日08:00；含交通接送"
    },
    {
      "code": "GA07",
      "name": "巷弄長照站喘息（時）",
      "price": 170,
      "remotePrice": 205,
      "unit": "小時",
      "note": ""
    },
    {
      "code": "GA09",
      "name": "居家喘息服務（2小時為一單位）",
      "price": 770,
      "remotePrice": 925,
      "unit": "2小時",
      "note": "單日上限10小時"
    }
  ],
  "shortTermServices": [
    {
      "code": "SC03",
      "name": "日間照顧中心日照服務（含餐）",
      "price": 1250,
      "unit": "日",
      "note": "包含餐飲、衛教、服務、活動安排及相關服務。"
    },
    {
      "code": "SC04",
      "name": "日間照顧中心日間服務（半日）",
      "price": 625,
      "unit": "半日",
      "note": "半日制日照服務，含餐飲、衛教、服務、活動安排及相關服務。"
    },
    {
      "code": "SC05",
      "name": "機構住宿式短期照顧服務",
      "price": 2310,
      "unit": "日",
      "note": "機構住宿式全日（24 小時）照顧服務，含餐飲、衛教、服務、活動安排及相關服務。以 1 日（24 小時）為 1 補助單位。"
    },
    {
      "code": "SC06",
      "name": "小規模多機能服務（夜間住宿）",
      "price": 2000,
      "unit": "夜",
      "note": "小規模多機能機構夜間住宿服務，含生活起居協助、進食、衛教、服務、活動安排及相關服務。"
    },
    {
      "code": "SC07",
      "name": "息夫短期照顧服務",
      "price": 170,
      "unit": "時",
      "note": "含臨時或短期居家喘息服務。"
    },
    {
      "code": "SC09",
      "name": "居家喘息服務",
      "price": 770,
      "unit": "2小時",
      "note": "由合格人員於案主家中提供喘息服務，含生活照顧協助與支持。每次以 2 小時為單位，每月以 10 次為上限。"
    }
  ],
  "equipmentEnvironment": [
    {
      "code": "EA01",
      "item": "馬桶增高器/便盆椅/沐浴椅",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 1200,
      "minUsageYears": 3,
      "unit": "購置",
      "note": ""
    },
    {
      "code": "EB01",
      "item": "單支枴杖—不鏽鋼製",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 1000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": "可雙側申請額度加倍"
    },
    {
      "code": "EB02",
      "item": "單支枴杖—鋁製",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 500,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "可雙側申請額度加倍"
    },
    {
      "code": "EB03",
      "item": "助行器",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 800,
      "minUsageYears": 3,
      "unit": "購置",
      "note": ""
    },
    {
      "code": "EB04",
      "item": "帶輪型助步車（助行椅）",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 300,
      "purchaseCap": 3000,
      "minUsageYears": 3,
      "unit": "月/購置",
      "note": "需輔具評估；具煞車/休憩座"
    },
    {
      "code": "EC01",
      "item": "輪椅A款（非輕量化量產型）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 3500,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "配骨盆帶；與EC02/EC03擇一"
    },
    {
      "code": "EC02",
      "item": "輪椅B款（輕量化量產型）",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 450,
      "purchaseCap": 4000,
      "minUsageYears": 3,
      "unit": "月/購置",
      "note": "配骨盆帶；與EC01/EC03擇一"
    },
    {
      "code": "EC03",
      "item": "輪椅C款（量身訂製型）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 9000,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "免部分負擔；與EC01/EC02擇一"
    },
    {
      "code": "EC04",
      "item": "輪椅附加功能A（利於移位）",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 150,
      "purchaseCap": 5000,
      "minUsageYears": 3,
      "unit": "月/購置",
      "note": "需搭配EC02或EC03"
    },
    {
      "code": "EC05",
      "item": "輪椅附加功能B（仰躺）",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 150,
      "purchaseCap": 2000,
      "minUsageYears": 3,
      "unit": "月/購置",
      "note": "配胸帶/防傾桿；搭配EC02/EC03"
    },
    {
      "code": "EC06",
      "item": "輪椅附加功能C（空中傾倒）",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 150,
      "purchaseCap": 4000,
      "minUsageYears": 3,
      "unit": "月/購置",
      "note": "配胸帶/防傾桿；搭配EC02/EC03"
    },
    {
      "code": "EC07",
      "item": "擺位系統A（平面型背靠）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 1000,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "免部分負擔"
    },
    {
      "code": "EC08",
      "item": "擺位系統B（曲面適形背靠）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 6000,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "免部分負擔"
    },
    {
      "code": "EC09",
      "item": "擺位系統C（軀幹側支撐架）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 3000,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "免部分負擔；單支補助減半"
    },
    {
      "code": "EC10",
      "item": "擺位系統D（頭靠系統）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 2500,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "免部分負擔"
    },
    {
      "code": "EC11",
      "item": "電動輪椅",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 2500,
      "purchaseCap": null,
      "minUsageYears": null,
      "unit": "月",
      "note": "需評估；含特殊座椅/控制器"
    },
    {
      "code": "EC12",
      "item": "電動代步車",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 1200,
      "purchaseCap": null,
      "minUsageYears": null,
      "unit": "月",
      "note": "四輪；前輪距>30cm"
    },
    {
      "code": "ED01",
      "item": "移位腰帶",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 1500,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "需評估"
    },
    {
      "code": "ED02",
      "item": "移位板",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 2000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": "需評估"
    },
    {
      "code": "ED03",
      "item": "人力移位吊帶",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 4000,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "需評估"
    },
    {
      "code": "ED04",
      "item": "移位滑墊A（坐姿）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 3000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": "需評估"
    },
    {
      "code": "ED05",
      "item": "移位滑墊B（臥姿）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 8000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": "需評估"
    },
    {
      "code": "ED06",
      "item": "移位轉盤",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 2000,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "需評估"
    },
    {
      "code": "ED07",
      "item": "移位機（懸吊式電動）",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 2000,
      "purchaseCap": 40000,
      "minUsageYears": 10,
      "unit": "月/購置",
      "note": "含吊帶；需評估"
    },
    {
      "code": "ED08",
      "item": "移位機吊帶（更換）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 6000,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "ED07購置3年後更換"
    },
    {
      "code": "EE01",
      "item": "電話擴音器",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 2000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": ""
    },
    {
      "code": "EE02",
      "item": "電話閃光震動器",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 2000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": ""
    },
    {
      "code": "EE03",
      "item": "火警閃光警示器",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 2000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": ""
    },
    {
      "code": "EE04",
      "item": "門鈴閃光器",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 2000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": ""
    },
    {
      "code": "EE05",
      "item": "無線震動警示器",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 2000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": ""
    },
    {
      "code": "EF01",
      "item": "衣著用輔具（穿衣桿/穿鞋器等）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 500,
      "minUsageYears": 3,
      "unit": "購置",
      "note": ""
    },
    {
      "code": "EF02",
      "item": "居家用生活輔具（門把/開關等）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 500,
      "minUsageYears": 3,
      "unit": "購置",
      "note": ""
    },
    {
      "code": "EF03",
      "item": "飲食用輔具（特殊刀叉杯盤等）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 500,
      "minUsageYears": 3,
      "unit": "購置",
      "note": ""
    },
    {
      "code": "EG01",
      "item": "氣墊床A",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 300,
      "purchaseCap": 8000,
      "minUsageYears": 3,
      "unit": "月/購置",
      "note": "免部分負擔；預防/減輕褥瘡"
    },
    {
      "code": "EG02",
      "item": "氣墊床B",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 500,
      "purchaseCap": 12000,
      "minUsageYears": 3,
      "unit": "月/購置",
      "note": "免部分負擔；含CPR洩氣閥等規範"
    },
    {
      "code": "EG03",
      "item": "輪椅座墊A（連通管型-塑膠）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 5000,
      "minUsageYears": 2,
      "unit": "購置",
      "note": "免部分負擔"
    },
    {
      "code": "EG04",
      "item": "輪椅座墊B（連通管型-橡膠）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 10000,
      "minUsageYears": 2,
      "unit": "購置",
      "note": "免部分負擔"
    },
    {
      "code": "EG05",
      "item": "輪椅座墊C（液態凝膠）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 10000,
      "minUsageYears": 2,
      "unit": "購置",
      "note": "免部分負擔"
    },
    {
      "code": "EG06",
      "item": "輪椅座墊D（固態凝膠）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 8000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": "免部分負擔"
    },
    {
      "code": "EG07",
      "item": "輪椅座墊E（填充式氣囊）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 8000,
      "minUsageYears": 5,
      "unit": "購置",
      "note": "免部分負擔"
    },
    {
      "code": "EG08",
      "item": "輪椅座墊F（交替充氣型）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 5000,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "免部分負擔；含電動幫浦"
    },
    {
      "code": "EG09",
      "item": "輪椅座墊G（量製型）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 10000,
      "minUsageYears": 3,
      "unit": "購置",
      "note": "免部分負擔"
    },
    {
      "code": "EH01",
      "item": "居家用照顧床",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 1000,
      "purchaseCap": 8000,
      "minUsageYears": 5,
      "unit": "月/購置",
      "note": "床面三片以上，頭/腿升降功能"
    },
    {
      "code": "EH02",
      "item": "照顧床附加A（床面升降）",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 200,
      "purchaseCap": 5000,
      "minUsageYears": 5,
      "unit": "月/購置",
      "note": "需搭配EH01"
    },
    {
      "code": "EH03",
      "item": "照顧床附加B（電動升降）",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 500,
      "purchaseCap": 5000,
      "minUsageYears": 5,
      "unit": "月/購置",
      "note": "需搭配EH01"
    },
    {
      "code": "EH04",
      "item": "爬梯機（單趟）",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 700,
      "purchaseCap": null,
      "minUsageYears": null,
      "unit": "趟",
      "note": "需受訓操作"
    },
    {
      "code": "EH05",
      "item": "爬梯機（月）",
      "rentalAvailable": "是",
      "rentalMonthlyCap": 4000,
      "purchaseCap": null,
      "minUsageYears": null,
      "unit": "月",
      "note": "需受訓操作"
    },
    {
      "code": "FA01",
      "item": "居家無障礙-固定扶手",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 150,
      "minUsageYears": 10,
      "unit": "10公分計價",
      "note": "每10公分150元"
    },
    {
      "code": "FA02",
      "item": "居家無障礙-可動式扶手",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 3600,
      "minUsageYears": 10,
      "unit": "處",
      "note": "單支計價"
    },
    {
      "code": "FA03",
      "item": "居家無障礙-非固定式斜坡板A",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 3500,
      "minUsageYears": 10,
      "unit": "件",
      "note": "非輕量化或>30cm便攜式"
    },
    {
      "code": "FA04",
      "item": "居家無障礙-非固定式斜坡板B",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 5000,
      "minUsageYears": 10,
      "unit": "件",
      "note": "輕量化可折疊>90cm"
    },
    {
      "code": "FA05",
      "item": "居家無障礙-非固定式斜坡板C",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 10000,
      "minUsageYears": 10,
      "unit": "件",
      "note": "輕量化可折疊>120cm且荷重≥180kg"
    },
    {
      "code": "FA06",
      "item": "居家無障礙-固定式斜坡道",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 10000,
      "minUsageYears": 10,
      "unit": "處",
      "note": "金屬/泥作，長≥150cm"
    },
    {
      "code": "FA07",
      "item": "居家無障礙-架高和式地板拆除",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 5000,
      "minUsageYears": 10,
      "unit": "處",
      "note": "含截水溝工程"
    },
    {
      "code": "FA08",
      "item": "居家無障礙-反光貼條/止滑",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 3000,
      "minUsageYears": 3,
      "unit": "處",
      "note": "單處計價"
    },
    {
      "code": "FA09",
      "item": "居家無障礙-隔間牆",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 600,
      "minUsageYears": 10,
      "unit": "平方公尺",
      "note": "每㎡ 600元"
    },
    {
      "code": "FA10",
      "item": "居家無障礙-防滑措施",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 3000,
      "minUsageYears": 10,
      "unit": "處",
      "note": "單處計價"
    },
    {
      "code": "FA11",
      "item": "居家無障礙-門A款",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 7000,
      "minUsageYears": 10,
      "unit": "處",
      "note": "門片類型/門檻調整等"
    },
    {
      "code": "FA12",
      "item": "居家無障礙-門B款（加寬/新設等）",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 10000,
      "minUsageYears": 10,
      "unit": "處",
      "note": "A/B擇一"
    },
    {
      "code": "FA13",
      "item": "居家無障礙-水龍頭",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 3000,
      "minUsageYears": 10,
      "unit": "處",
      "note": "撥桿/單閥/感應式"
    },
    {
      "code": "FA14",
      "item": "居家無障礙-改善浴缸",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 7000,
      "minUsageYears": 10,
      "unit": "處",
      "note": "含乾濕分離/拆缸等"
    },
    {
      "code": "FA15",
      "item": "居家無障礙-改善洗臉台",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 3000,
      "minUsageYears": 10,
      "unit": "處",
      "note": ""
    },
    {
      "code": "FA16",
      "item": "居家無障礙-改善馬桶",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 5000,
      "minUsageYears": 10,
      "unit": "處",
      "note": "含免治/蹲改坐"
    },
    {
      "code": "FA17",
      "item": "居家無障礙-壁掛式淋浴椅(床)",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 5000,
      "minUsageYears": 10,
      "unit": "處",
      "note": ""
    },
    {
      "code": "FA18",
      "item": "居家無障礙-改善流理台",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 15000,
      "minUsageYears": 10,
      "unit": "處",
      "note": "腿部淨空≥65cm要求"
    },
    {
      "code": "FA19",
      "item": "居家無障礙-改善抽油煙機位置",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 1000,
      "minUsageYears": 10,
      "unit": "處",
      "note": "位置調整"
    },
    {
      "code": "FA20",
      "item": "居家無障礙-特殊簡易洗槽",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 2000,
      "minUsageYears": 10,
      "unit": "處",
      "note": ""
    },
    {
      "code": "FA21",
      "item": "居家無障礙-特殊簡易浴槽",
      "rentalAvailable": "否",
      "rentalMonthlyCap": null,
      "purchaseCap": 5000,
      "minUsageYears": 10,
      "unit": "處",
      "note": ""
    }
  ],
  "copayRates": [
    {
      "serviceBucket": "B/C（照顧及專業服務）",
      "householdStatus": "低收入戶",
      "copayPercent": 0
    },
    {
      "serviceBucket": "B/C（照顧及專業服務）",
      "householdStatus": "中低收入戶",
      "copayPercent": 5
    },
    {
      "serviceBucket": "B/C（照顧及專業服務）",
      "householdStatus": "一般戶",
      "copayPercent": 16
    },
    {
      "serviceBucket": "D-第一類（交通接送）",
      "householdStatus": "低收入戶",
      "copayPercent": 0
    },
    {
      "serviceBucket": "D-第一類（交通接送）",
      "householdStatus": "中低收入戶",
      "copayPercent": 10
    },
    {
      "serviceBucket": "D-第一類（交通接送）",
      "householdStatus": "一般戶",
      "copayPercent": 30
    },
    {
      "serviceBucket": "D-第二類（交通接送）",
      "householdStatus": "低收入戶",
      "copayPercent": 0
    },
    {
      "serviceBucket": "D-第二類（交通接送）",
      "householdStatus": "中低收入戶",
      "copayPercent": 9
    },
    {
      "serviceBucket": "D-第二類（交通接送）",
      "householdStatus": "一般戶",
      "copayPercent": 27
    },
    {
      "serviceBucket": "D-第三類（交通接送）",
      "householdStatus": "低收入戶",
      "copayPercent": 0
    },
    {
      "serviceBucket": "D-第三類（交通接送）",
      "householdStatus": "中低收入戶",
      "copayPercent": 8
    },
    {
      "serviceBucket": "D-第三類（交通接送）",
      "householdStatus": "一般戶",
      "copayPercent": 25
    },
    {
      "serviceBucket": "D-第四類（交通接送）",
      "householdStatus": "低收入戶",
      "copayPercent": 0
    },
    {
      "serviceBucket": "D-第四類（交通接送）",
      "householdStatus": "中低收入戶",
      "copayPercent": 7
    },
    {
      "serviceBucket": "D-第四類（交通接送）",
      "householdStatus": "一般戶",
      "copayPercent": 21
    },
    {
      "serviceBucket": "E/F（輔具/居家無障礙）",
      "householdStatus": "低收入戶",
      "copayPercent": 0
    },
    {
      "serviceBucket": "E/F（輔具/居家無障礙）",
      "householdStatus": "中低收入戶",
      "copayPercent": 10
    },
    {
      "serviceBucket": "E/F（輔具/居家無障礙）",
      "householdStatus": "一般戶",
      "copayPercent": 30
    },
    {
      "serviceBucket": "G（喘息服務）",
      "householdStatus": "低收入戶",
      "copayPercent": 0
    },
    {
      "serviceBucket": "G（喘息服務）",
      "householdStatus": "中低收入戶",
      "copayPercent": 5
    },
    {
      "serviceBucket": "G（喘息服務）",
      "householdStatus": "一般戶",
      "copayPercent": 16
    }
  ],
  "dataDictionary": [
    {
      "table": "need_levels_caps",
      "field": "need_level",
      "type": "整數",
      "description": "長照需要等級（2~8）"
    },
    {
      "table": "need_levels_caps",
      "field": "bc_monthly_cap",
      "type": "整數(元)",
      "description": "B/C碼每月額度"
    },
    {
      "table": "need_levels_caps",
      "field": "D_cat*_monthly_cap",
      "type": "整數(元)",
      "description": "交通接送各類別每月額度"
    },
    {
      "table": "need_levels_caps",
      "field": "ef_cap_3y",
      "type": "整數(元)",
      "description": "E/F碼三年額度"
    },
    {
      "table": "need_levels_caps",
      "field": "g_annual_cap",
      "type": "整數(元)/空值",
      "description": "G碼一年額度（待確認）"
    },
    {
      "table": "transport_category_by_city",
      "field": "jurisdiction",
      "type": "文字",
      "description": "縣市"
    },
    {
      "table": "transport_category_by_city",
      "field": "category",
      "type": "1~4",
      "description": "D碼分類"
    },
    {
      "table": "transport_category_by_city",
      "field": "category_name",
      "type": "文字",
      "description": "分類名稱"
    },
    {
      "table": "transport_category_by_town",
      "field": "jurisdiction/township",
      "type": "文字",
      "description": "偏遠鄉鎮市區（第四類）"
    },
    {
      "table": "indigenous_or_island_areas",
      "field": "type",
      "type": "文字",
      "description": "離島/原民區"
    },
    {
      "table": "service_codes",
      "field": "group",
      "type": "文字",
      "description": "服務群組"
    },
    {
      "table": "service_codes",
      "field": "code",
      "type": "文字",
      "description": "組合碼"
    },
    {
      "table": "service_codes",
      "field": "name",
      "type": "文字",
      "description": "組合名稱"
    },
    {
      "table": "service_codes",
      "field": "price_general",
      "type": "整數(元)/空值",
      "description": "一般地區支付價格"
    },
    {
      "table": "service_codes",
      "field": "price_indigenous_or_island",
      "type": "整數(元)/空值",
      "description": "原民區或離島支付價格"
    },
    {
      "table": "service_codes",
      "field": "unit",
      "type": "文字",
      "description": "計價單位"
    },
    {
      "table": "service_codes",
      "field": "notes",
      "type": "文字",
      "description": "重要備註"
    },
    {
      "table": "equip_env",
      "field": "code/item",
      "type": "文字",
      "description": "輔具/居家無障礙項目"
    },
    {
      "table": "equip_env",
      "field": "rental_available",
      "type": "布林",
      "description": "是否可租賃"
    },
    {
      "table": "equip_env",
      "field": "rental_cap_month",
      "type": "整數(元)/空值",
      "description": "每月租賃給付上限"
    },
    {
      "table": "equip_env",
      "field": "purchase_cap",
      "type": "整數(元)/空值",
      "description": "購置給付上限"
    },
    {
      "table": "equip_env",
      "field": "min_use_years",
      "type": "整數/空值",
      "description": "最低使用年限"
    },
    {
      "table": "equip_env",
      "field": "unit",
      "type": "文字",
      "description": "計價單位"
    },
    {
      "table": "copay_rates",
      "field": "service_bucket",
      "type": "文字",
      "description": "服務類別"
    },
    {
      "table": "copay_rates",
      "field": "household_status",
      "type": "文字",
      "description": "低收/中低收/一般戶"
    },
    {
      "table": "copay_rates",
      "field": "copay_percent",
      "type": "百分比(%)",
      "description": "部分負擔比率"
    },
    {
      "table": "taoyuan_profile",
      "field": "*",
      "type": "文字",
      "description": "桃園市摘要設定"
    }
  ]
};

function getTaoyuanLtcData(){
  return JSON.parse(JSON.stringify(TAOYUAN_LTC_DATA));
}

function getTaoyuanLtcTable(tableName){
  const key = String(tableName || '').trim();
  const data = TAOYUAN_LTC_DATA[key];
  if (!data) return [];
  return JSON.parse(JSON.stringify(data));
}
