var _ = require('lodash');
var http = require('https');
// var url = 'https://proxy.destinytrialsreport.com/Platform/Destiny/1/Account/4611686018429564083/Character/2305843009214947218/Inventory/?definitions=true';
var url = 'https://proxy.destinytrialsreport.com/Platform/Destiny/1/Account/4611686018428398835/Character/2305843009240585311/Inventory/?definitions=true';
var summary = null;
var buckets = null;
var items = [];
var types = [
  4023194814, // Ghost
  3448274439, // Helmet
  3551918588, // Gauntlet
  14239492, // Chest
  20886954, // Leg
  1585787867, // Class Item
  434908299 // Artifact
];

function getMaxStat(base, light, type) {
    var maxLight = 335;
    var rate = 0;

    if (light < 280) {
        return base;
    }

    switch (type) {
        case 3448274439:
            rate = 1 / 6;
            break;
        case 3551918588:
            rate = 1 / 6;
            break;
        case 14239492:
            rate = 1 / 5;
            break;
        case 20886954:
            rate = 1 / 5;
            break;
        case 1585787867:
        case 4023194814:
            rate = 1 / 10;
            break;
        case 434908299:
            rate = 1 / 10;
            break;
        default:
            return base;
    }

    return Math.floor(rate * (maxLight - light) + base);
}

function getBonus(light, type) {
    var result;

    switch (type) {
        case 3448274439:
            result = light < 292 ? 15 :
                light < 307 ? 16 :
                light < 319 ? 17 :
                light < 332 ? 18 : 19;
            break;
        case 3551918588:
            result = light < 287 ? 13 :
                light < 305 ? 14 :
                light < 319 ? 15 :
                light < 333 ? 16 : 17;
            break;
        case 14239492:
            result = light < 287 ? 20 :
                light < 300 ? 21 :
                light < 310 ? 22 :
                light < 319 ? 23 :
                light < 328 ? 24 : 25;
            break;
        case 20886954:
            result = light < 284 ? 18 :
                light < 298 ? 19 :
                light < 309 ? 20 :
                light < 319 ? 21 :
                light < 329 ? 22 : 23;
            break;
        case 1585787867:
        case 4023194814:
            result = light < 295 ? 8 :
                light < 319 ? 9 : 10;
            break;
        case 434908299:
            result = light < 287 ? 34 :
                light < 295 ? 35 :
                light < 302 ? 36 :
                light < 308 ? 37 :
                light < 314 ? 38 :
                light < 319 ? 39 :
                light < 325 ? 40 :
                light < 330 ? 41 : 42;
            break;
            defult:
                result = 0;
            break;
    }

    return result;
}

var isNodeActivated = function(talentGrid, nodes, nodeStepHash) {
    // node.stepIndex
    // node.isActivated
    // node.nodeHash
    var result = false;

    _.each(nodes, function(node) {
        if (result) {
            return;
        }

        var talentGridNode = _.find(talentGrid.nodes, { nodeHash: node.nodeHash });
        var step = _.find(talentGridNode.steps, { stepIndex: node.stepIndex, nodeStepHash: nodeStepHash });

        if (_.isObject(step)) {
            result = node.isActivated;
        }
    });

    return result;
}








http.get(url, function(res){
    var body = '';

    res.on('data', function(chunk){
        body += chunk;
    });

    res.on('end', function(){
        summary = JSON.parse(body);
        buckets = summary.Response.data.buckets.Equippable;

        types.forEach(function(type) {
            var bucket = _.find(buckets, { bucketHash: type });

            if (_.isArray(bucket.items) && _.size(bucket.items) > 0) {
                var item = bucket.items[0];
                var talentGrid = summary.Response.definitions.talentGrids[item.talentGridHash];

                // console.log(JSON.stringify(talentGrid, null, 2));

                var intStat = _.find(item.stats, { statHash: 144602215 });
                var disStat = _.find(item.stats, { statHash: 1735777505 });
                var strStat = _.find(item.stats, { statHash: 4244567218 });

                var parsedItem = {
                    hash: item.itemHash,
                    type: type,
                    defense: (item.primaryStat) ? item.primaryStat.value : 0,
                    stats: {
                        int: {
                            value: (intStat) ? intStat.value : 0,
                            nodeActive: false,
                            base: 0,
                            max: 0
                        },
                        dis: {
                            value: (disStat) ? disStat.value : 0,
                            nodeActive: false,
                            base: 0,
                            max: 0
                        },
                        str: {
                            value: (strStat) ? strStat.value : 0,
                            nodeActive: false,
                            base: 0,
                            max: 0
                        }
                    }
                };

                var itemCsp = 0;
                var statCount = 0;

                if (parsedItem.stats.int.value > 0) {
                    statCount += 1;
                    parsedItem.stats.int.nodeActive = isNodeActivated(talentGrid, item.nodes, 1034209669) // Intellect
                    parsedItem.stats.int.base = (parsedItem.stats.int.nodeActive) ? parsedItem.stats.int.value - getBonus(parsedItem.defense, type) : parsedItem.stats.int.value;
                    parsedItem.stats.int.max = getMaxStat(parsedItem.stats.int.base, parsedItem.defense, parsedItem.type);
                }

                if (parsedItem.stats.dis.value > 0) {
                    statCount += 1;
                    parsedItem.stats.dis.nodeActive = isNodeActivated(talentGrid, item.nodes, 1263323987) // Dicipline
                    parsedItem.stats.dis.base = (parsedItem.stats.dis.nodeActive) ? parsedItem.stats.dis.value - getBonus(parsedItem.defense, type) : parsedItem.stats.dis.value;
                    parsedItem.stats.dis.max = getMaxStat(parsedItem.stats.dis.base, parsedItem.defense, parsedItem.type);
                }

                if (parsedItem.stats.str.value > 0) {
                    statCount += 1;
                    parsedItem.stats.str.nodeActive = isNodeActivated(talentGrid, item.nodes, 193091484) // Strength
                    parsedItem.stats.str.base = (parsedItem.stats.str.nodeActive) ? parsedItem.stats.str.value - getBonus(parsedItem.defense, type) : parsedItem.stats.str.value;
                    parsedItem.stats.str.max = getMaxStat(parsedItem.stats.str.base, parsedItem.defense, parsedItem.type);
                }

                var parsed = {
                    item_hash: parsedItem.hash,
                    item_type: parsedItem.type,
                    item_defense: parsedItem.defense,
                    item_split: (statCount > 1),
                    item_int: parsedItem.stats.int.value,
                    item_int_base: parsedItem.stats.int.base,
                    item_int_max: parsedItem.stats.int.max,
                    item_int_active: parsedItem.stats.int.nodeActive,
                    item_dis: parsedItem.stats.dis.value,
                    item_dis_base: parsedItem.stats.dis.base,
                    item_dis_max: parsedItem.stats.dis.max,
                    item_dis_active: parsedItem.stats.dis.nodeActive,
                    item_str: parsedItem.stats.str.value,
                    item_str_base: parsedItem.stats.str.base,
                    item_str_max: parsedItem.stats.str.max,
                    item_str_active: parsedItem.stats.str.nodeActive,
                    item_csp: parsedItem.stats.int.max + parsedItem.stats.dis.max + parsedItem.stats.str.max + getBonus(parsedItem.defense, parsedItem.type)
                }

                items.push(parsed);
            }
        });

        console.log(JSON.stringify(items, null, 2));
    });
});
