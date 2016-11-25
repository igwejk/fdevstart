/**
 * @file
 * @module toolmatcher.nunit
 * @copyright (c) 2016 Gerd Forstmann
 */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../gen_cov' : '../../gen';

var debuglog = require('debug')('sentence.nunit');

const sentence = require(root + '/match/sentence.js');

debuglog(' here sentence ' + JSON.stringify(sentence));

const oSentence = [
      {'matchedString' : 'start', 'category' : 'filler'},
      {'matchedString' : 'catalog', 'category' : 'category'},
      {'matchedString' : 'ABC', 'category' : 'catalog'},
      {'matchedString' : 'in', 'category' : 'filler'},
      {'matchedString' : 'FLPD', 'category' : 'tool'},
      {'matchedString' : 'in', 'category' : 'filler'},
      {'matchedString' : 'UV2', 'category' : 'systemId'},
      {'matchedString' : 'client', 'category' : 'category'},
      {'matchedString' : '120', 'category' : 'client'}
];

exports.testFindWordByCategory = function (test) {
  // prepare
  // act
  const res = sentence.findWordByCategory(oSentence, 'catalog');
  // check
  test.deepEqual(res, { word : oSentence[2], index : 2}, 'correct result');
  test.equal(res.word, oSentence[2], 'correct result');
  test.done();
};

exports.testFindWordByCategoryNotFound = function (test) {
  // prepare
  // act
  const res = sentence.findWordByCategory(oSentence, 'notthese');
  // check
  test.deepEqual(res, {});
  test.done();
};
