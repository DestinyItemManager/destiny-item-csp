var _ = require('lodash');
var summary = require('./summary.json');

var buckets = summary.Response.data.buckets.Equippable;
var types = [
  4023194814, // Ghost
  3448274439, // Helmet
  3551918588, // Gauntlet
  14239492, // Chest
  20886954, // Leg
  1585787867, // Class Item
  434908299 // Artifact
];

var items = [];

var getBaseStat = function (item) {
  return {
    'int': 0,
    'dis': 0,
    'str': 0
  }
};

types.forEach(function(type) {
  var bucket = _.find(buckets, { 'bucketHash': type });

  if (_.isArray(bucket.items) && _.size(bucket.items) > 0) {
    var item = bucket.items[0];
    var itemInt = _.find(item.stats, { 'statHash': 144602215 }).value;
    var itemDis = _.find(item.stats, { 'statHash': 1735777505 }).value;
    var itemStr = _.find(item.stats, { 'statHash': 4244567218 }).value;
    var itemCsp = itemInt + itemDis + itemStr;
    var baseInt = 0;
    var baseDis = 0;
    var baseStr = 0;

    var parsed = {
      'item_hash': item.itemHash,
      'item_type': type,
      'item_defense': item.primaryStat.value,
      'item_int': itemInt,
      'item_dis': itemDis,
      'item_str': itemStr,
      'item_csp': itemCsp,
      'item_base_int': baseInt,
      'item_base_dis': baseDis,
      'item_base_str': baseStr
    }

    items.push(parsed);
  }
});

console.log(JSON.stringify(items, null, 2));
