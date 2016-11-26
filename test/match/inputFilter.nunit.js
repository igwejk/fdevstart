var process = require('process')
var root = (process.env.DO_COVERAGE) ? '../../gen_cov' : '../../gen'

var debuglog = require('debug')('inputFilter.nunit')

const inputFilter = require(root + '/match/inputFilter.js')

const ab = inputFilter

exports.testcountAinB = function (test) {
  var fut = inputFilter.countAinB
  test.equal(fut({abc: 'def', hij: 1}, {hijs: 4}), 0, 'ok')
  test.done()
}

exports.testcountAinBOne = function (test) {
  //  console.log(JSON.stringify(inputFilter, undefined, 2) + "yyyyyyyyyyyyyyyy")
  var fut = inputFilter.countAinB
  test.equal(fut({abc: 'def', hij: 1}, {hij: 2}), 1, 'ok')
  test.done()
}

exports.testcountAinBCompareEQ = function (test) {
  var fut = inputFilter.countAinB
  test.equal(fut({abc: 'def', hij: 1}, {hij: 1}, function (s1, s2) { return s1 && (s1 === s2) }), 1, 'ok')
  test.done()
}

exports.testcountAinBCompareFN = function (test) {
  var fut = inputFilter.countAinB
  test.equal(fut({abc: 'def', hij: 1, klm: 'U'}, {hij: 1, klm: 'U'},
    function (s1, s2) { return s1 && s1 === s2 }), 2, 'ok')
  test.done()
}

exports.testcountAinBCompareMult1 = function (test) {
  var fut = inputFilter.countAinB
  test.equal(fut({abc: 'def', hij: 1, klm: undefined}, {hij: 1, klm: 'U'},
    function (s1, s2) { return s1 && s1 === s2 }), 1, 'ok')
  test.done()
}

exports.testcountAinBCompareMult = function (test) {
  var fut = inputFilter.countAinB
  test.equal(fut({abc: 'def', hij: 1, klm: 0}, {hij: 1, klm: 0},
    function (s1, s2) { return s1 !== undefined && s1 === s2 }), 2, 'ok')
  test.done()
}

exports.testcountAinBCompareIgnore = function (test) {
  var fut = inputFilter.countAinB
  test.equal(fut({abc: 'def', hij: 1, klm: 0}, {hij: 1, klm: 0},
    function (s1, s2) { return s1 !== undefined && s1 === s2 }, 'klm'), 1, 'ok')
  test.done()
}

exports.testcountAinBCompareIgnore2 = function (test) {
  var fut = inputFilter.countAinB
  test.equal(fut({abc: 'def', hij: 1, klm: 0}, {hij: 1, klm: 0},
    function (s1, s2) { return (s1 !== undefined) && (s1 === s2) }, ['klm', 'hij']), 0, 'ok')
  test.done()
}

exports.testspuriouAnotInB = function (test) {
  var fut = inputFilter.spuriousAnotInB
  test.deepEqual(fut({abc: 'def', hij: 1, klm: 0}, {hij: 1, klm: 0}, ['klm', 'hij']), 1, 'ok')
  test.done()
}

exports.testspuriouAnotInBIgnore = function (test) {
  var fut = inputFilter.spuriousAnotInB
  test.equal(fut({abc: 'def', hij: 1, klm: 0}, {hij: 1, klm: 0}, ['abc', ' klm', 'hij']), 0, 'ok')
  test.done()
}

exports.testspuriouAnotInBIgnore2 = function (test) {
  var fut = inputFilter.spuriousAnotInB
  test.equal(fut({abc: 'def', 'u': 1, hij: 1, klm: 0}, {c: 3, hij: 1, klm: 0},
    ['abc', ' klm', 'hij']), 1, 'ok')
  test.done()
}

exports.testcompareContext = function (test) {
  var fut = inputFilter.compareContext
  var a = {abc: 'def', hij: 1, klm: 0, ff: 'B'}
  var b = {hij: 1, klm: 0, ff: 'A', e: 1, c: 0, h: 2}
  test.deepEqual(fut(a, b),
    { equal: 2,
      different: 1,
      spuriousL: 1,
      spuriousR: 3
    },
    'ok')
  test.done()
}

exports.testcompareContextIgnorePrivate = function (test) {
  var fut = inputFilter.compareContext
  var a = {abc: 'def', _a: 1, _b: 3, hij: 1, klm: 0, ff: 'B'}
  var b = {hij: 1, _a: 1, _c: 3, _b: 4, klm: 0, ff: 'A', e: 1, c: 0, h: 2}
  test.deepEqual(fut(a, b),
    { equal: 2,
      different: 1,
      spuriousL: 1,
      spuriousR: 3
    },
    'ok')
  test.done()
}

exports.testcompareContextIgnore = function (test) {
  var fut = inputFilter.compareContext
  var a = {abc: 'def', hij: 1, klm: 0, ff: 'B'}
  var b = {hij: 1, klm: 0, ff: 'A', e: 1, c: 0, h: 2}
  test.deepEqual(fut(a, b, ['abc']),
    { equal: 2,
      different: 1,
      spuriousL: 0,
      spuriousR: 3
    },
    'ok')
  test.done()
}

exports.test_matchWord = function (test) {
  const fn = inputFilter.matchWord

  // test.expect(3)
  test.deepEqual(fn({
    key: 'NoTPresent'
  },
    {
      systemObjectId: 'ClientSideTragetResol',
      systemObjectCategory: 'unit'
    }),
    undefined, 'not applicable to irrelevant key')
  test.done()
}

exports.test_matchWordAlias = function (test) {
  const fn = inputFilter.matchWord
  // test.expect(3)
  test.deepEqual(fn({
    key: 'systemObjectId',
    word: 'CSTR',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  },
    {
      systemObjectId: 'CSTR',
      systemObjectCategory: 'unit'
    }),
    undefined, 'not applicable to irrelevant key')
  test.done()
}

exports.test_matchWordAliasMatchOthersTrue = function (test) {
  const fn = inputFilter.matchWord
  // test.expect(3)
  var oRule = {
    key: 'systemObjectId',
    word: 'ClientSideTargetResolution',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  }
  var oValue = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit'
  }
  test.deepEqual(fn(oRule,
    oValue, { matchothers: true }),
    undefined, 'not applicable to irrelevant key')
  test.done()
}

exports.test_matchWordAliasMatchOthersFalse = function (test) {
  const fn = inputFilter.matchWord
  // test.expect(3)
  var oRule = {
    key: 'systemObjectId',
    word: 'clientsidetargetresolution',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  }
  var oValue = {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  }
  test.deepEqual(fn(oRule,
    oValue, { matchothers: false }),
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'xunit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 0
      }
    }
    , ' matched')
  test.done()
}

exports.test_matchWordAliasMatchOthersFalseOverride = function (test) {
  const fn = inputFilter.matchWord
  // test.expect(3)
  var oRule = {
    key: 'systemObjectId',
    word: 'clientsidetargetresolution',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  }
  var oValue = {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  }
  test.deepEqual(fn(oRule,
    oValue, { matchothers: false,
      override: true
    }),
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 0
      }
    }
    , ' matched and override')
  test.done()
}

var oRuleWord = {
  type: 'word',
  key: 'systemObjectId',
  word: 'cstr',
  follows: {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit'
  }
}

var oRuleWordLong = {
  type: 'word',
  key: 'systemObjectId',
  word: 'ClientSideTargetResolution',
  follows: {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit'
  }
}

exports.test_matchWordAlias = function (test) {
  const fn = ab.matchWord
  // test.expect(3)
  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'unit',
    abc: 'ABC'
  }
  var res = fn(oRuleWord, oContext)
  // console.log(JSON.stringify(res))
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 0
      }
    }, ' incorrect result')
  test.done()
}

exports.test_matchWordAliasDifferentCat = function (test) {
  const fn = ab.matchWord
  // test.expect(3)

  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  }
  var res = fn(oRuleWord, oContext)
  test.deepEqual(res, {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'xunit',
    abc: 'ABC',
    _weight: { 'systemObjectId': 0 }
  }
  /* undefined */, ' no match')
  test.done()
}

const enumRULETYPEWORD = 0
const enumRULETYPEREGEXP = 1

exports.test_applyRulesEqualChoice = function (test) {
  // prepare
  var aRules = [
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ]

  var oContext = {
    keyA: 'ValueA'
  }
  // act
  var res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 2, 'found at least two')
  // console.log(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected')
  test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  test.done()
}

exports.test_matchOthersTrue = function (test) {
  // prepare
  var aRules = [
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ]

  var oContext = {
    keyA: 'ValueA',
    keyB: 'Nothingmatches'
  }
  // act
  var res = ab.matchWord(aRules[0], oContext, { matchothers: true })
  // test
  test.ok(res === undefined, ' undefined ')
  test.done()
}

exports.test_matchOthersFalse = function (test) {
  // prepare
  var aRules = [
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ]

  var oContext = {
    keyA: 'ValueA',
    keyB: 'NothingMatches'
  }
  // act
  var res = ab.matchWord(aRules[0], oContext, { matchothers: false })
  debuglog('2222222222>' + JSON.stringify(res, undefined, 2))
  // test
  test.deepEqual(res.keyB, 'NothingMatches', ' categorypicked ')
  test.done()
}

exports.test_matchOthersFalseOverride = function (test) {
  // prepare
  var aRules = [
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ]

  var oContext = {
    keyA: 'ValueA',
    keyB: 'NothingMatches'
  }
  // act
  var res = ab.matchWord(aRules[0], oContext, { matchothers: false, override: true })
  debuglog('2222222222>' + JSON.stringify(res, undefined, 2))
  // test
  test.deepEqual(res.keyB, 'CategoryB', ' categorypicked ')
  test.done()
}

exports.test_applyRules = function (test) {
  // prepare
  var aRules = [
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD, // WORD
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    },
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD, // WORD
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    }
  ]

  var oContext = {
    keyA: 'ValueA',
    keyB: 'CategoryB'
  }
  // act
  var res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length > 0, 'found one')
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected')
  test.done()
}

exports.test_applyRulesEqualChoice = function (test) {
  // prepare
  var aRules = [
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ]

  var oContext = {
    keyA: 'ValueA'
  }
  // act
  var res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 2, 'found at least two')
  // console.log(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected')
  test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  test.done()
}

exports.test_applyRulesNotCategoryFit = function (test) {
  // prepare
  var aRules = [
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ]

  var oContext = {
    keyA: 'ValueA',
    keyB: 'Nothingmatches'
  }
  // act
  var res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 2, 'found at least two')
  debuglog(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected')
  test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  test.done()
}

exports.test_applyRulesGoodFitInOtherCategory = function (test) {
  // prepare
  var aRules = [
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    { word: 'valueb',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ]
  var oContext = {
    keyA: 'ValueB',
    keyB: 'CategoryB'
  }
  // act
  var res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 1, 'found at least two')
  debuglog(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected')
  test.deepEqual(res[0].keyA, 'Synonym', 'category respected')
  // test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  test.done()
}

exports.test_applyRulesLevenBestFitCategory = function (test) {
  // prepare
  var aRules = [
    { word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'SynonymA',
        'keyB': 'CategoryB'
      }
    },
    { word: 'valueabc',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'SynonymABC',
        'keyB': 'CategoryB'
      }
    },
    { word: 'valueabcdefg',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'SynonymDEF',
        'keyB': 'CategoryB'
      }
    },
    { word: 'valueb',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ]
  var oContext = {
    keyA: 'valueabf',
    keyB: 'CategoryB'
  }
  // act
  var res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 1, 'found at least two')
  debuglog(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected')
  test.deepEqual(res[0].keyA, 'SynonymABC', 'category respected')

  // test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  test.done()
}

exports.test_matchWordAliasOverride = function (test) {
  const fn = ab.matchWord
  // test.expect(3)

  var oContext = {
    systemObjectId: 'CSTR',
    abc: 'ABC'
  }
  var res = fn(oRuleWord, oContext, {
    augment: true
  })
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 0
      }
    }, ' incorrect result')
  test.done()
}

exports.test_matchWordAliasOverrideDifferent = function (test) {
  const fn = ab.matchWord
  // test.expect(3)

  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  }
  var res = fn(oRuleWord, oContext, {
    override: true
  })
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 0
      }
    }, ' incorrect result')
  test.done()
}

exports.test_ruleLevenBeforeFallback = function (test) {
  // prepare
  // there a
  var aRules = [
    {
      word: 'somewhatfar',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'somewhatfar',
        'keyB': 'System3'
      }
    },
    {
      word: 'somewhatclose',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'somewhatclose',
        'keyB': 'System2'
      }
    },
    {
      regexp: /^.*$/,
      key: 'keyA',
      type: enumRULETYPEREGEXP,
      follows: {
        _ranking: 0.9
      }
    }
  ]
  var oContext = {
    keyA: 'somewhatcl'
  }
  // act
  var res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 1, 'found at least one')
  debuglog(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyA, 'somewhatclose', 'category propagated')
  test.deepEqual(res[0].keyB, 'System2', 'category picked')

  oContext = {
    keyA: 'gibts gar nicht'
  }
  // act
  res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 1, 'found at least one')
  debuglog(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyA, 'gibts gar nicht', 'result propagated')
  test.deepEqual(res[0].keyB, undefined, 'category picked')
  test.done()
// test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
}

exports.test_extractArgsMap = function (test) {
  var res = ab.extractArgsMap(['A', 'B', 'C'], { 2: 'X2', 1: 'X1' })
  test.deepEqual(res,
    { 'X2': 'C', 'X1': 'B' }, ' incorrect result')
  test.done()
}
exports.test_extractArgsMapUndef = function (test) {
  var res = ab.extractArgsMap(['A', 'B', 'C'], undefined)
  test.deepEqual(res,
    { }, ' incorrect result')
  test.done()
}
exports.test_extractArgsMapEmptyMatch = function (test) {
  var res = ab.extractArgsMap(['A', '', 'C'], { 2: 'X2', 1: 'X1' })
  test.deepEqual(res,
    { 'X2': 'C' }, ' incorrect result')
  test.done()
}
exports.test_extractArgsMapOutOfRange = function (test) {
  var res = ab.extractArgsMap(['A', '', 'C'], { 2: 'X2', 4: 'X1' })
  test.deepEqual(res,
    { 'X2': 'C' }, ' incorrect result')
  test.done()
}

exports.test_matchWordNonMatched = function (test) {
  const fn = ab.matchWord
  // test.expect(3)
  var oContext = {
    systemObjectId: 'Way off the page',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  }
  var res = fn(oRuleWord, oContext)
  test.deepEqual(res,
    undefined, ' incorrect result')
  test.done()
}

exports.test_matchWordLevenClose = function (test) {
  const fn = ab.matchWord
  // test.expect(3)
  var oContext = {
    systemObjectId: 'ClientSideTrgetResolution',
    systemObjectCategory: 'unit',
    abc: 'ABC'
  }
  var res = fn(oRuleWordLong, oContext)
  // console.log('Res is ' + res)
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 41
      }
    }, ' incorrect result ')
  test.done()
}

exports.test_ruleRegexp = function (test) {
  // prepare
  // there a
  var aRules = [
    { regexp: /^[a-z0-9_]{3,3}$/,
      key: 'keyA',
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System3'
      }
    },
    {
      regexp: /^[a-z0-9_]{4,4}$/,
      key: 'keyA',
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System4'
      }
    }
  ]
  var oContext = {
    keyA: 'ABC'
  }
  // act
  var res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 1, 'found at least one')
  debuglog(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyA, 'ABC', 'category propagated')
  test.deepEqual(res[0].keyB, 'System3', 'category picked')

  oContext = {
    keyA: 'ABCD'
  }
  // act
  res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 1, 'found at least one')
  debuglog(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyA, 'ABCD', 'result propagated')
  test.deepEqual(res[0].keyB, 'System4', 'category picked')
  // test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  oContext = {
    keyA: 'ABCDE'
  }
  // act
  res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length === 0, 'found nothing')
  test.done()
}

exports.test_ruleRegexpExtraction = function (test) {
  // prepare
  // there a
  var aRules = [
    { regexp: /^([a-z0-9_]{3,3})clnt(\d{3,3})$/i,
      key: 'keyA',
      argsMap: {
        1: 'systemId',
        2: 'client'
      },
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System3'
      }
    }
  ]
  var oContext = {
    keyA: 'UV2CLNT123'
  }
  // act
  var res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 1, 'found at least one')
  debuglog(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyA, 'UV2CLNT123', 'category propagated')
  test.deepEqual(res[0].keyB, 'System3', 'category picked')
  test.deepEqual(res[0].systemId, 'uv2', 'extract1 picked')
  test.deepEqual(res[0].client, '123', 'extract2 picked')
  test.done()
}

exports.test_ruleRegexpExtractionReplacing = function (test) {
  // prepare
  // there a
  var aRules = [
    { regexp: /^([a-z0-9_]{3,3})CLNT(\d{3,3})$/i,
      key: 'systemId',
      argsMap: {
        1: 'systemId',
        2: 'client'
      },
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System3'
      }
    }
  ]
  var oContext = {
    systemId: 'UV2CLNT123'
  }
  // act
  var res = ab.augmentContext(oContext, aRules)
  // test
  test.ok(res.length >= 1, 'found at least one')
  debuglog(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyB, 'System3', 'category propagated')
  test.deepEqual(res[0].systemId, 'uv2', 'category picked')
  test.deepEqual(res[0].client, '123', 'category picked')
  test.done()
}

exports.test_matchSthElse = function (test) {
  const fn = ab.matchWord
  // test.expect(3)
  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  }
  var res = fn(oRuleWord, oContext)
  // console.log(JSON.stringify(res))
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'xunit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 0
      }
    }, ' incorrect result')
  test.done()
}

exports.test_applyRules = function (test) {
  // prepare
  var oContext = {
    'systemObjectId': 'ClientsideTrgetRes'
  }
  // act
  var res = ab.applyRules(oContext)
  // test
  debuglog('The end result : ' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].systemObjectId, 'ClientSideTargetResolution', ' typo corrected')
  test.deepEqual(res[0].systemObjectCategory, 'unit test', 'category determined ok')
  test.done()
}

exports.test_applyRulesWithCategory = function (test) {
  // prepare
  var oContext = {
    'systemObjectId': 'ClientsideTrgetRes',
    'systemObjectCategory': 'unit'
  }
  // act
  var res = ab.applyRules(oContext)
  // test
  test.deepEqual(res[0].systemObjectId, 'ClientSideTargetResolution', ' typo corrected')
  test.deepEqual(res[0].systemObjectCategory, 'unit test', 'category determined ok')
  test.done()
}

exports.testinputFilter = function (test) {
  const fn = ab.augmentContext
  // test.expect(3)
  test.deepEqual(fn({
    systemObjectId: 'ClientSideTragetResol',
    systemObjectCategory: 'unit'
  }, [
    {
      type: 1
    }
  ]),
    [], 'return undefined')
  test.done()
}
