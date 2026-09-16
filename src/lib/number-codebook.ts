export interface NumberCodebookEntry {
  code: string;
  original: string;
  association: string;
  english: string;
  teenTopic: string;
}

const ORIGINAL = [
  '鈴鐺','靈異事件','趙靈兒','山','零食','蓮霧','煙斗','令旗','泥巴','菱角',
  '衣領','筷子','嬰兒','醫生','鑰匙','鸚鵡','野柳','儀器','尾巴','藥酒',
  '鴨子','鱷魚','耳機','和尚','耳屎','二胡','河流','耳機','惡霸','餓囚',
  '森林','鯊魚','扇兒','仙丹','紳士','珊瑚','山鹿','山雞','婦女','三角尺',
  '司令','司儀','柿兒','石山','石獅','師父','石榴','司機','絲瓜','四球',
  '武林','狐狸','木耳','烏山','武士','火舞','物流箱','武器','尾巴','五角星',
  '榴槤','輪椅','牛耳','硫酸','律師','鑼鼓','乳牛','油漆','喇叭','遛狗',
  '麒麟','蜥蜴','企鵝','旗山','騎士','積木','犀牛','機器人','西瓜','氣球',
  '巴黎鐵塔','白蟻','靶心','爬山','巴士','白虎','芭樂','白旗','琵琶','八爪魚',
  '精靈','球衣','球兒','舊傘','教師','酒壺','九頭牛','酒旗','酒吧','舅舅',
] as const;

const ASSOCIATIONS = [
  '鈴鐺','靈異事件','趙靈兒','山','零食','蓮霧','煙斗','007','泥巴','菱角',
  '衣領','筷子','嬰兒','醫生','鑰匙','鸚鵡','石榴／野柳','儀器','尾巴','救護車',
  '古堡','鱷魚','雙耳／兔耳朵／一對耳環／雙胞胎／兩隻天鵝','和尚／麥可喬丹／LeBron James','耳屎','二胡','河流','耳機','惡霸','二舊',
  '森林／三菱汽車','鯊魚／鱔魚','扇兒','仙丹／來遲','紳士／膳食纖維','珊瑚','沙漏','山雞','婦女','三角尺／三角飯糰',
  '司令','司儀','柿兒','石山','石獅','師父／食物','石榴','司機','絲瓜','死狗',
  '武林','狐狸','木耳','烏山','武士','火舞','物流箱','武器','尾巴','五角星',
  '榴槤','輪椅','牛耳','硫酸','律師','鑼鼓','乳牛','油漆','喇叭','遛狗',
  '麒麟','蜥蜴','企鵝','旗山','騎士','積木','犀牛','機器人','西瓜','氣球',
  '巴黎鐵塔','白蟻','靶心','爬山','巴士','白虎','芭樂','白旗','琵琶','八爪魚',
  '精靈','球衣','球兒','舊傘','教師','酒壺','九頭牛','酒旗','酒吧','舅舅',
] as const;

const ENGLISH = [
  'bell','ghost story','fantasy heroine','mountain','snack','wax apple','smoking pipe','secret agent','mud','water chestnut',
  'collar','chopsticks','baby','doctor','key','parrot','stone fruit','instrument','tail','ambulance',
  'castle','crocodile','headphones','monk / basketball legend','earwax','erhu','river','earbuds','bully','old pair',
  'forest','shark / eel','hand fan','magic pill','gentleman','coral','hourglass','pheasant','woman','triangle ruler',
  'commander','host','persimmon','rock mountain','stone lion','master / food','pomegranate','driver','luffa','four balls',
  'martial arts world','fox','wood ear mushroom','dark mountain','samurai','fire dance','delivery box','weapon','tail','five-point star',
  'durian','wheelchair','cow ear','sulfuric acid','lawyer','gong and drum','cow','paint','speaker','walking a dog',
  'qilin','lizard','penguin','Qishan','knight','building blocks','rhino','robot','watermelon','balloon',
  'Eiffel Tower','termite','bullseye','hiking','bus','white tiger','guava','white flag','pipa','octopus',
  'elf','jersey','ball kid','old umbrella','teacher','wine flask','nine cows','wine banner','bar','uncle',
] as const;

const TEEN_TOPICS = [
  '上課鐘聲','校園怪談 Podcast','仙俠手遊角色','畢旅爬山打卡','超商新品零食','手搖飲水果配料','復古穿搭道具','特務風短影音','雨天球鞋踩泥','夜市菱角小吃',
  '制服衣領','福利社免洗筷','班級寶寶濾鏡','醫學系志願','宿舍鑰匙圈','AI 鸚鵡配音','地理課野柳戶外教學','樂團社器材','偶像應援吊飾','健康課 CPR 挑戰',
  '奇幻遊戲古堡','動物迷因','降噪耳機讀書','籃球 23 號球衣','尷尬但好笑的迷因','國樂社表演','河濱單車 Vlog','通勤藍牙耳機','反霸凌議題','二手拍賣挖寶',
  '森林系露營','鯊魚寶寶 Remix','手持小風扇','考前能量補給','畢業舞會正裝','珊瑚保育專題','段考倒數沙漏','炸雞團購','性別平等課','數學課三角尺',
  '社團總召','校慶主持人','秋季水果便當','Minecraft 石山基地','校門石獅打卡','社團指導老師','石榴氣泡飲','駕照考試話題','絲瓜料理挑戰','球類社團四顆球',
  '武俠劇追番','狐狸系 AI 頭像','火鍋木耳','暗黑系風景照','動漫武士 Cosplay','舞蹈社火焰舞台','網購開箱','電競遊戲武器','吊飾尾巴','五星好評截圖',
  '榴槤披薩挑戰','無障礙校園倡議','生物課牛耳模型','化學實驗安全','法律系生涯探索','熱音社打擊樂','鮮奶品牌聯名','教室牆面彩繪','藍牙喇叭歌單','放學遛狗限動',
  '國風遊戲神獸','爬蟲寵物頻道','企鵝貼圖','高雄旗山老街','奇幻 RPG 騎士','積木機器人社','犀牛保育報告','AI 機器人專題','西瓜冰沙','生日氣球佈置',
  '交換學生巴黎夢','宿舍除蟲日','射箭社靶心','登山社百岳清單','公車通學月票','白虎遊戲造型','芭樂梅粉午餐','投降系迷因','國樂社琵琶 Cover','章魚燒放學約',
  '精靈系濾鏡','球賽應援球衣','籃球社學弟','雨天共傘偶像劇','AI 教師助教','古風市集酒壺','健身房九牛之力','園遊會復古旗幟','無酒精 Mocktail 吧','舅舅贊助畢旅',
] as const;

export const NUMBER_CODEBOOK: NumberCodebookEntry[] = ORIGINAL.map((original, index) => ({
  code: String(index).padStart(2, '0'),
  original,
  association: ASSOCIATIONS[index],
  english: ENGLISH[index],
  teenTopic: TEEN_TOPICS[index],
}));

export const CODE_WORDS = NUMBER_CODEBOOK.map((entry) => entry.association.split('／')[0]) as string[];

export function chunkNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return [];
  const normalized = digits.length % 2 ? `0${digits}` : digits;
  return normalized.match(/\d{2}/g) ?? [];
}
