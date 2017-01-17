var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../gen_cov' : '../../gen';
//var debuglog = require('debug')('plainRecoginizer.nunit');

var debug = require('debug');
const debuglog = debug('smartdialog.nunit');


var logger = require(root + '/utils/logger');
var HTMLConnector = require(root + '/ui/htmlconnector.js');
const SmartDialog = require(root + '/bot/smartdialog.js');



// Create bot and bind to console
function getBotInstance() {
  var connector = new HTMLConnector.HTMLConnector();
  SmartDialog.makeBot(connector);
  return connector;
}

//var conn = getBotInstance();

function testOne(str,cb) {
  var conn = getBotInstance();
  conn.setAnswerHook(cb);
  conn.processMessage(str, 'unittest');
  return conn;
}

//SimpleUpDownRecognizer

function doRecognize( sText, cb) {
  debuglog('type ' + typeof SmartDialog.SimpleUpDownRecognizer);
  var recognizer = new (SmartDialog.SimpleUpDownRecognizer)();
  recognizer.recognize({
    message : {
      text : sText
    }
  }, cb);
}

exports.testUpDownRecognizerQuit2 =  function (test) {
  doRecognize('quit', function(err, res) {
    test.deepEqual(res.intent,  'intent.up');
    test.done();
  });
};

exports.testUpDownRecognizerUp = function (test) {
  doRecognize('up', function(err, res) {
    test.deepEqual(res.intent,  'intent.up');
    test.done();
  });
};


exports.testUpDownRecognizerUp = function (test) {
  doRecognize('down', function(err, res) {
    test.deepEqual(res.intent,  'intent.down');
    test.done();
  });
};
exports.testUpDownRecognizerDone = function (test) {
  doRecognize('done', function(err, res) {
    test.deepEqual(res.intent,  'intent.up');
    test.done();
  });
};

exports.testUpDownRecognizerExit = function (test) {
  doRecognize('exit', function(err, res) {
    test.deepEqual(res.intent,  'intent.up');
    test.done();
  });
};

exports.testUpDownRecognizer2 = function (test) {
  doRecognize('donenothing', function(err, res) {
    test.deepEqual(res.intent,  'nothing');
    test.done();
  });
};

exports.testUpDownRecognizer2 = function (test) {
  doRecognize('exit', function(err, res) {
    test.deepEqual(res.intent,  'intent.up');
    test.done();
  });
};


/* TODO!

exports.testShowMe1 = function (test) {
  var cnt = 0;
  testOne('start SU01 in',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    cnt = cnt + 1;
    test.deepEqual((cnt === 1) && (sRes.indexOf('Not enough') < 0), false);
    test.deepEqual((cnt === 2) && (sRes.indexOf('Please provide') < 0), false, 'first call');
    if(cnt === 2) {
      testOne('UV2', function(oRes) {
        debuglog(JSON.stringify(oRes));
        testOne('120', function(oRes) {
          debuglog(JSON.stringify(oRes));
          test.done();
        });
      });
    }
  });
};
*/

exports.testShowMe2 = function (test) {
  testOne('start SU01 in UV2 client 120',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes.indexOf('120') >= 0, false, 'wiki present');
    test.done();
  });
};

exports.testListAllMultipleCategories = function (test) {
  testOne('List all atomic weight, element name, element symbol for element name silver',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes,  'the atomic weight, element name, element symbol for element name silver are ...\n"107.8682(2)", "silver" and "Ag"' );
    test.done();
  });
};

exports.testListAllMultipleCategories2 = function (test) {
  testOne('What is the atomic weight and element symbol for gold',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes, 'The "atomic weight" and "element symbol" of gold are "196.966 569(5)" and "Au"\n');
    test.deepEqual(sRes.indexOf('966') >= 0, true, 'wiki present');
    test.done();
  });
};

exports.testListAllMultipleCategoriesBadMix = function (test) {
  testOne('What is the unit test and element symbol for gold',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes, 'I don\'t know anything about "unit test and element symbol" ("unit test" and "element symbol")" in relation to "gold"');
    test.done();
  });
};

exports.testListAllMultipleOK2 = function (test) {
  testOne('list all element name, atomic weight for mercury',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes, 'the element name, atomic weight for mercury are ...\n"mercury" and "200.592(3)"' );

    test.done();
  });
};

exports.testTooLongWordCount = function (test) {
  testOne('a b c d e f g h i j "k l m n o p" r s t ad so on is very short a',function(oRes) {
    //console.log('here answeres', SmartDialog.aResponsesOnTooLong.join('\n'));
    test.deepEqual(SmartDialog.aResponsesOnTooLong.indexOf(oRes) >= 0, true);
    test.done();
  });
};


exports.testTooLongSentence = function (test) {
  testOne('ahasdfasdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
  +' kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk '
  +' kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk '
  +' kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk '
  + ' jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj jjjjjjjjjjjjjjjjjjjj'
  + ' llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll',function(oRes) {
    test.deepEqual(SmartDialog.aResponsesOnTooLong.indexOf(oRes) >= 0, true);
    test.done();
  });
};

exports.testListAllMultipleBadCombine = function (test) {
  testOne('list all element name, wiki for mercury',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes, 'I cannot combine "element name, wiki(Error: categories "element name" and "wiki" have no common domain.)' );
    test.done();
  });
};



exports.testShowMe2 = function (test) {
  testOne('What is the element weight for element name silver',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes.indexOf('107.') >= 0, true, 'wiki present');
    test.done();
  });
};


exports.testDomainsListAllIn = function (test) {
  testOne('list all categories in domain IUPAC',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes.indexOf('wiki') >= 0, false, 'wiki present');
    test.deepEqual(sRes.indexOf('element name') >= 0, true, 'wiki present');
    test.done();
  });
};


exports.testDomains = function (test) {
  testOne('list all domains',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes.indexOf('wiki') >= 0, true, 'wiki present');
    test.deepEqual(sRes.indexOf('FioriFLP') >= 0, true, 'wiki present');
    test.done();
  });
};


exports.testSuggest = function (test) {
  testOne('help me',function(oRes) {
    //var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.done();
  });
};


exports.testListWithContextDontKnow = function (test) {
  testOne('list abcnames for silver',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes.indexOf('know anything about \"abcnames\"') >= 0, true, 'not found');
    test.done();
  });
};

exports.testListWithContextKnow = function (test) {
  testOne('list all element name for silver',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes.indexOf('silver') >= 0, true, 'silver present');
    test.done();
  });
};


exports.testEliza = function (test) {
  testOne('i am sad',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes.indexOf('sad') >= 0, true, 'sad present');
    test.done();
  });
};

exports.testTrain = function (test) {
  testOne('i am sad',function(oRes) {
    testOne('Wrong', function(oRes){
      testOne('down', function(oRes){
        testOne('What is this', function(oRes){
          testOne('done', function(oRes){
            testOne('done', function(oRes){
              testOne('list all domains', function(oRes){
                var sRes = oRes;
                debuglog(JSON.stringify(oRes));
                test.deepEqual(sRes.indexOf('wiki') >= 0, true, 'wiki present');
                test.deepEqual(sRes.indexOf('FioriFLP') >= 0, true, 'FioriFLP present');
                test.done();
              });
            });
          });
        });
      });
    });
  });
};

exports.testListAllNotACat = function (test) {
  testOne('list all NOTACATEGORY',function(oRes) {
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes,
    'I don\'t know anything about "NOTACATEGORY"(Error: "undefined)');
    test.done();
  });
};

//TODO; this should accept undefined and list more!
exports.testListAllMultOnlyCat = function (test) {
  testOne('list all orbits, object type',function(oRes) {
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes,
    'the orbits, object type are ...\n"Alpha Centauri C" and "planet";\n"n/a" and "star, red dwarf";\n"Sun" and "planet"'
     );
    test.done();
  });
};




exports.testListAllCategories = function (test) {
  testOne('list all categories',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes.indexOf('wiki') >= 0, true, 'wiki present');
    test.deepEqual(sRes.indexOf('FioriFLP') < 0, true, 'wiki present');
    test.done();
  });
};

exports.testListAllCategoriesInDomain = function (test) {
  testOne('list all categories in domain unit test',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes.indexOf('wiki') < 0, true, 'wiki present');
    test.deepEqual(sRes.indexOf('url') >= 0, true, 'wiki present');
    test.deepEqual(sRes.indexOf('unit test') >= 0, true, 'wiki present');
    test.done();
  });
};

exports.testListAllCategoriesRelatedTo = function (test) {
  testOne('list all categories related to unit test',function(oRes) {
    var sRes = oRes;
    debuglog(JSON.stringify(oRes));
    test.deepEqual(sRes.indexOf('wiki') < 0, true, 'wiki present');
    test.deepEqual(sRes.indexOf('unit test') >= 0, true, 'wiki present');
    test.done();
  });
};

exports.testDescribeStupidDomain = function (test) {
  testOne('describe ABC in domain NODomain',function(oRes) {
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'I did not infer a domain restriction from "NODomain". Specify an existing domain. (List all domains) to get exact names.\n');
    test.done();
  });
};


exports.testDescribeCategory = function (test) {
  testOne('describe category',function(oRes) {
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes,
    '"category" is ' + SmartDialog.metawordsDescriptions['category']);
    test.done();
  });
};

exports.testDescribeCategorySenselessDomain = function (test) {
  testOne('describe category in domain wiki',function(oRes) {
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes,
'"in domain "wiki" make no sense when matching a metaword.\n' +

    '"category" is ' + SmartDialog.metawordsDescriptions['category']);
    test.done();
  });
};


exports.testDescribeOneAtATime = function (test) {
  testOne('describe silver and gold',function(oRes) {
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes,'Whoa, i can only explain one thing at a time, not "silver and gold". Please ask one at a time.');
    test.done();
  });
};

exports.testDescribeEcc = function (test) {
  testOne('describe eccentricity',function(oRes) {
    debuglog(JSON.stringify(oRes));
    const DESCRIBE_ECCEN =  '"eccentricity"  is a category in domain "Cosmos"\nIt is present in 2 (33.3%) of records in this domain,\n'
    + 'having 2(+1) distinct values.\nPossible values are ...\n"0.0167" or "0.0934"';
    test.deepEqual(oRes,
    DESCRIBE_ECCEN);
    test.done();
  });
};

exports.testDescribe = function (test) {
  testOne('describe silver',function(oRes) {
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes,
     '"silver" has a meaning in one domain "IUPAC":\n"silver" is a value for category "element name" present in 1(0.8%) of records;\n'
        );
    test.done();
  });
};


exports.testDescribeEarth = function (test) {
  testOne('describe earth',function(oRes) {
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes,
    '"earth" has a meaning in 2 domains: "Cosmos" and "Philosophers elements"\nin domain "Cosmos" "earth" is a value for category "object name" present in 1(16.7%) of records;\nin domain "Philosophers elements" "earth" is a value for category "element name" present in 1(25.0%) of records;\n'
    );
    test.done();
  });
};



exports.testOperatorStartsWith = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all element names starting with ni',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'my element names starting with "ni" are ...\nnickel;\nnihonium;\nniobium;\nnitrogen');
    test.done();
  });
};

exports.testOperatorStartsWithFI = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all Application Components starting with FI',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'I don\'t know anything about \"Application Components\"');
    test.done();
  });
};


exports.testOperatorCatEndingUPAC = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories ending with UPA!',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'I have no categories ending with "UPA"');
    test.done();
  });
};



exports.testOperatorContainingUPAC = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all domains containing "UPA"',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'my domains containing "UPA" are ...\nIUPAC');
    test.done();
  });
};

exports.testOperatorContainingNit = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all tools containing "nit"',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'my tools containing "nit" are ...\nunit test');
    test.done();
  });
};


exports.testOperatorEndingWith = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all tools ending with "ABC"',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'I have no tools ending with "ABC"');
    test.done();
  });
};


exports.testOperatorCategoriesStartsWith = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories starting with elem?',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'my categories starting with "elem" are ...\nelement name;\nelement number;\nelement properties;\nelement symbol');
    test.done();
  });
};

exports.testOperatorStartsWithQuoted = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories starting with "elem"',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'my categories starting with "elem" are ...\nelement name;\nelement number;\nelement properties;\nelement symbol');
    test.done();
  });
};

exports.testOperatorStartsWithQuotedInDomain = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories starting with "elem" in domain IUPAC',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'my categories starting with "elem" in domain "IUPAC" are ...\nelement name;\nelement number;\nelement symbol');
    test.done();
  });
};

exports.testOperatorStartsWithQuotedInDomainSloppy = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories starting with "elem" in domain IUPAD',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'my categories starting with "elem" in domain "IUPAC" are ...\nelement name;\nelement number;\nelement symbol');
    test.done();
  });
};


exports.testOperatorStartsWithQuotedInNoDomain = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all categories starting with "elem" in domain NONEXSITENT',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'I did not infer a domain restriction from "NONEXSITENT". Specify an existing domain. (List all domains) to get exact names.\n');
    test.done();
  });
};

exports.testOperatorStartsWithQuotedMemberInDomain = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all element names starting with e in domain IUPAC',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(oRes, 'my element names starting with "e" in domain "IUPAC" are ...\neinsteinium;\nerbium;\neuropium');
    test.done();
  });
};


//var debug = require('debug');

var logPerf = logger.perf('perflistall');
//var perflog = debug('perf');


exports.testPerfListAll1 = function (test) {
  logPerf('testPerfListAll1');
  testOne('list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning',function(oRes) {
   // var sRes = oRes;
    logPerf('testPerfListAll1');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(true, true);
    test.done();
  });
};


exports.testPerfListAll2 = function (test) {
  logPerf('testPerfListAll');
 // var u = 'list all AppNames in FIN-GL Account Manage fiori intent MM-PUR Work Center WBS Elements Planning related to unit test';
  testOne('list all AppNames in FIN-GL Account Manage fiori intent related to unit test',function(oRes) {
  //  var sRes = oRes;
    logPerf('testPerfListAll');
    debuglog(JSON.stringify(oRes));
    test.deepEqual(true, true);
    test.done();
  });
};


exports.testUpDownRecognizerUp = function (test) {
  doRecognize('up', function(err, res) {
    test.deepEqual(res.intent,  'intent.up');
    test.done();
  });
};