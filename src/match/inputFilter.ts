/// <reference path="../../lib/node-4.d.ts" />


/**
 * the input filter stage preprocesses a current context
 *
 * It a) combines multi-segment arguments into one context members
 * It b) attempts to augment the context by additional qualifications
 *           (Mid term generating Alternatives, e.g.
 *                 ClientSideTargetResolution -> unit test?
 *                 ClientSideTargetResolution -> source ?
 *           )
 *  Simple rules like  Intent
 *
 *
 * @module
 * @file inputFilter.ts
 */
import * as distance from '../utils/damerauLevenshtein';

import * as debug from 'debug';

import * as IMatch from './ifmatch';

import * as breakdown from './breakdown';

const debuglog = debug('inputFilter')

import * as matchdata from './matchdata';
  var oUnitTests = matchdata.oUnitTests

  /**
   * @param sText {string} the text to match to NavTargetResolution
   * @param sText2 {string} the query text, e.g. NavTarget
   *
   * @return the distance, note that is is *not* symmetric!
   */
  function calcDistance (sText1 : string, sText2 : string) : number {
    // console.log("length2" + sText1 + " - " + sText2)
    var a0 = distance.levenshtein(sText1.substring(0, sText2.length), sText2)
    var a = distance.levenshtein(sText1.toLowerCase(), sText2)
    return a0 * 500 / sText2.length + a
  }

import * as IFMatch from '../match/ifmatch';

type IRule = IFMatch.IRule


interface IMatchOptions {
  matchothers? : boolean,
  augment?: boolean,
  override? : boolean
}

interface IMatchCount {
  equal : number
  different : number
  spuriousR : number
  spuriousL : number
}

type EnumRuleType = IFMatch.EnumRuleType


function nonPrivateKeys(oA) {
  return Object.keys(oA).filter( key => {
    return key[0] !== '_';
  });
}

export function countAinB (oA, oB, fnCompare, aKeyIgnore?) : number{
   aKeyIgnore = Array.isArray(aKeyIgnore) ?  aKeyIgnore :
      typeof aKeyIgnore === "string" ? [aKeyIgnore] :  [];
   fnCompare = fnCompare || function() { return true; }
   return nonPrivateKeys(oA).filter( function(key) {
     return aKeyIgnore.indexOf(key) < 0;
    }).
    reduce(function (prev, key) {
      if (Object.prototype.hasOwnProperty.call(oB, key)) {
        prev = prev + (fnCompare(oA[key],oB[key], key) ? 1 : 0)
      }
      return prev
    }, 0)
  }

export function spuriousAnotInB(oA,oB, aKeyIgnore? ) {
  aKeyIgnore = Array.isArray(aKeyIgnore) ?  aKeyIgnore :
      typeof aKeyIgnore === "string" ? [aKeyIgnore] :  [];
   return nonPrivateKeys(oA).filter( function(key) {
     return aKeyIgnore.indexOf(key) < 0;
    }).
    reduce(function (prev, key) {
      if (!Object.prototype.hasOwnProperty.call(oB, key)) {
        prev = prev + 1
      }
      return prev
    }, 0)
}

function lowerCase(o) {
  if (typeof o === "string") {
    return o.toLowerCase()
  }
  return o
}

export function compareContext(oA , oB, aKeyIgnore?) {
  var equal = countAinB(oA,oB, function(a,b) { return lowerCase(a) === lowerCase(b);}, aKeyIgnore);
  var different = countAinB(oA,oB, function(a,b) { return lowerCase(a) !== lowerCase(b);}, aKeyIgnore);
  var spuriousL = spuriousAnotInB(oA,oB, aKeyIgnore)
  var spuriousR = spuriousAnotInB(oB,oA, aKeyIgnore)
  return {
    equal : equal,
    different: different,
    spuriousL: spuriousL,
    spuriousR: spuriousR
  }
}


export function categorizeString(string : string, exact : boolean,  oRules : Array<IMatch.mRule>) : Array<IFMatch.ICategorizedString> {
  // simply apply all rules
  var res : Array<IMatch.ICategorizedString> = []
  oRules.forEach(function(oRule) {
    switch(oRule.type) {
      case IFMatch.EnumRuleType.WORD :
          if ( exact && oRule.word === string) {
            res.push( {
              string: string,
              matchedString : oRule.matchedString,
              category : oRule.category
            })
          }
          if (!exact) {
            var levenmatch = calcDistance(oRule.word,string)
            if (levenmatch < 150) {
              res.push({
                string: string,
                matchedString : oRule.word,
                category : oRule.category,
                levenmatch : levenmatch
              })
            }
          }
          break;
      case IFMatch.EnumRuleType.REGEXP: {

        debuglog(JSON.stringify(" here regexp" + JSON.stringify(oRule,undefined,2)))
        var m = oRule.regexp.exec(string)
        if(m) {
            res.push( {
              string: string,
                        matchedString : (oRule.matchIndex !== undefined && m[oRule.matchIndex]) || string,
                        category : oRule.category
            })
        }
      }
      break;
      default:
        throw new Error("unknown type" + JSON.stringify (oRule,undefined, 2))
    }
  });
    return res;
}
/**
 *
 * Options may be {
 * matchothers : true,  => only rules where all others match are considered
 * augment : true,
 * override : true }  =>
 *
 */
export function matchWord(oRule : IRule, context : IFMatch.context, options ? : IMatchOptions) {
  if (context[oRule.key] === undefined) {
    return undefined;
  }
  var s1 = context[oRule.key].toLowerCase()
  var s2 = oRule.word.toLowerCase();
  options = options || {}
  var delta = compareContext(context,oRule.follows, oRule.key)
  debuglog(JSON.stringify(delta));
  debuglog(JSON.stringify(options));
  if (options.matchothers && (delta.different > 0)){
    return undefined
  }
  var c : number = calcDistance(s2, s1);
   debuglog(" s1 <> s2 " + s1 + "<>" + s2 + "  =>: " + c);
  if(c < 150 ) {
    var res = Object.assign({}, oRule.follows) as any;
    res = Object.assign(res, context);
    if (options.override) {
      res = Object.assign(res, oRule.follows);
    }
    // force key property
    // console.log(' objectcategory', res['systemObjectCategory']);
    res[oRule.key] = oRule.follows[oRule.key] || res[oRule.key];
    res._weight = Object.assign({}, res._weight);
    res._weight[oRule.key] = c;
    Object.freeze(res);
    debuglog('Found one' + JSON.stringify(res,undefined,2));
    return res;
  }
  return undefined;
}

export function extractArgsMap(match : Array<string> , argsMap : { [key : number] : string}) : IFMatch.context {
  var res = {} as IFMatch.context;
  if (!argsMap) {
    return res;
  }
  Object.keys(argsMap).forEach(function(iKey) {
      var value = match[iKey]
      var key = argsMap[iKey];
      if ((typeof value === "string") && value.length > 0) {
        res[key] = value
      }
    }
  );
  return res;
}



export function analyzeString(sString : string, aRules : Array<IMatch.mRule> ) {

  var cnt = 0;
  var fac = 1;
  var u = breakdown.breakdownString(sString);
  debuglog("here breakdown" + JSON.stringify(u));
  var words = {} as  { [key: string]:  Array<IFMatch.ICategorizedString>};
  var res = u.map(function(aArr) {
    return aArr.map(function (sWordGroup : string) {
      var seenIt = words[sWordGroup];
      if (seenIt === undefined) {
        seenIt =  categorizeString(sWordGroup, true, aRules);
        words[sWordGroup] = seenIt;
      }
        cnt = cnt + seenIt.length;
        fac = fac * seenIt.length;
      if(!seenIt) {
        throw new Error("Expecting at least one match for " + sWordGroup)
      }
      return seenIt;
    });
  })
  debuglog(" sentences " + u.length + " matches " + cnt + " fac: " + fac);
  return res;
}

/*
[ [a,b], [c,d]]

00 a
01 b
10 c
11 d
12 c
*/


// we can replicate the tail or the head,
// we replicate the tail as it is smaller.

// [a,b,c ]

export function expandMatchArr(deep : Array<Array<any>>) : Array<Array<any>> {
  var a = [];
  var line = [];
  debuglog(JSON.stringify(deep));
  deep.forEach(function(uBreakDownLine, iIndex : number) {
    line[iIndex] = [];
    uBreakDownLine.forEach(function(aWordGroup , wgIndex: number) {
      line[iIndex][wgIndex] = [];
      aWordGroup.forEach(function (oWordVariant, iWVIndex : number) {
        line[iIndex][wgIndex][iWVIndex] = oWordVariant;
      });
    });
  })
  debuglog(JSON.stringify(line));
  var res = [];
  var nvecs = [];
  for(var i = 0; i < line.length; ++i) {
    var vecs = [[]];
    var nvecs =[];
    var rvec = [];
    for(var k = 0; k < line[i].length; ++k) { // wordgroup k
      //vecs is the vector of all so far seen variants up to k wgs.
      var nextBase = [];
      for(var l = 0; l < line[i][k].length; ++l ) { // for each variant
        debuglog("vecs now" + JSON.stringify(vecs));
        nvecs = []; //vecs.slice(); // copy the vec[i] base vector;
        debuglog("vecs copied now" + JSON.stringify(nvecs));
        for(var u = 0; u < vecs.length; ++u) {
           nvecs[u] = vecs[u].slice(); //
           debuglog("copied vecs["+ u+"]" + JSON.stringify(vecs[u]));
           nvecs[u].push(line[i][k][l]); // push the lth variant
           debuglog("now nvecs " + nvecs.length + " " + JSON.stringify(nvecs));
        }
        debuglog(" at     " + k + ":" + l + " nextbase >" + JSON.stringify(nextBase))
        debuglog(" append " + k + ":" + l + " nvecs    >" + JSON.stringify(nvecs))
        nextBase = nextBase.concat(nvecs);
        debuglog("  result " + k + ":" + l + " nvecs    >" + JSON.stringify(nextBase))
      } //constru
      debuglog("now at " + k + ":" + l + " >" + JSON.stringify(nextBase))
      vecs = nextBase;
    }
    debuglog("APPENDING TO RES" + i + ":" + l + " >" + JSON.stringify(nextBase))
    res = res.concat(vecs);
  }
  return res;
}

export function matchRegExp(oRule : IRule, context : IFMatch.context, options ? : IMatchOptions) {
  if (context[oRule.key] === undefined) {
    return undefined;
  }
  var sKey = oRule.key;
  var s1 = context[oRule.key].toLowerCase()
  var reg = oRule.regexp;

  var m = reg.exec(s1);
  debuglog("applying regexp: " + s1 + " " + JSON.stringify(m));
  if (!m) {
    return undefined;
  }
  options = options || {}
  var delta = compareContext(context,oRule.follows, oRule.key)
  debuglog(JSON.stringify(delta));
  debuglog(JSON.stringify(options));
  if (options.matchothers && (delta.different > 0)){
    return undefined
  }
  var oExtractedContext = extractArgsMap(m, oRule.argsMap );
  debuglog("extracted args " + JSON.stringify(oRule.argsMap));
  debuglog("match " + JSON.stringify(m));

  debuglog("extracted args " + JSON.stringify(oExtractedContext));
  var res = Object.assign({}, oRule.follows) as any;
  res = Object.assign(res, oExtractedContext);
  res = Object.assign(res, context);
  if (oExtractedContext[sKey] !== undefined) {
    res[sKey] = oExtractedContext[sKey];
  }
  if (options.override) {
     res = Object.assign(res, oRule.follows);
     res = Object.assign(res, oExtractedContext)
  }
  Object.freeze(res);
  debuglog('Found one' + JSON.stringify(res,undefined,2));
  return res;
}

export function sortByWeight(sKey : string, oContextA : IFMatch.context, oContextB : IFMatch.context)  : number{
  debuglog('sorting: ' + sKey + 'invoked with\n 1:' + JSON.stringify(oContextA,undefined,2)+
   " vs \n 2:" + JSON.stringify(oContextB,undefined,2));
  var rankingA : number =  parseFloat(oContextA["_ranking"] || "1");
  var rankingB : number  = parseFloat(oContextB["_ranking"] || "1");
  if (rankingA !== rankingB) {
    debuglog(" rankin delta" + 100*(rankingB - rankingA));
    return 100*(rankingB - rankingA)
  }

  var weightA = oContextA["_weight"] && oContextA["_weight"][sKey]  || 0;
  var weightB = oContextB["_weight"] && oContextB["_weight"][sKey]  || 0;
  return +(weightA - weightB);
}


// Word, Synonym, Regexp / ExtractionRule

export function augmentContext1( context : IFMatch.context, oRules : Array<IRule>, options : IMatchOptions) : Array<IFMatch.context> {
  var sKey = oRules[0].key;
  // check that rule
  if (debuglog.enabled) {
    // check consistency
    oRules.every(function (iRule) {
      if (iRule.key !== sKey) {
        throw new Error("Inhomogenous keys in rules, expected " + sKey + " was " + JSON.stringify(iRule));
      }
      return true;
    });
  }

  // look for rules which match
  var res = oRules.map(function(oRule) {
    // is this rule applicable
    switch(oRule.type) {
      case IFMatch.EnumRuleType.WORD:
        return matchWord(oRule, context, options)
      case IFMatch.EnumRuleType.REGEXP:
        return matchRegExp(oRule, context, options);
   //   case "Extraction":
   //     return matchExtraction(oRule,context);
    }
    return undefined
  }).filter(function(ores) {
    return !!ores
  }).sort(
    sortByWeight.bind(this, sKey)
  );
  return res;
  // Object.keys().forEach(function (sKey) {
  // });
}

export function augmentContext( context : IFMatch.context, aRules : Array<IRule>) : Array<IFMatch.context> {

var options1 : IMatchOptions = {
    matchothers : true,
    override: false
  } as IMatchOptions;

  var aRes = augmentContext1(context,aRules,options1)

  if (aRes.length === 0)  {
    var options2 : IMatchOptions = {
        matchothers : false,
        override: true
    } as IMatchOptions;
    aRes = augmentContext1(context, aRules, options2);
  }
  return aRes;
}

export function insertOrdered(result : Array<IFMatch.context>, iInsertedMember : IFMatch.context, limit : number) : Array<IFMatch.context> {
  // TODO: use some weight
  if (result.length < limit) {
    result.push(iInsertedMember)
  }
  return result;
}


export function takeTopN(arr : Array<Array<IFMatch.context>>): Array<IFMatch.context> {
  var u = arr.filter(function(innerArr) { return innerArr.length > 0})

  var res =[];
  // shift out the top ones
  u = u.map(function(iArr) {
    var top = iArr.shift();
    res = insertOrdered(res,top,5)
    return iArr
  }).filter(function(innerArr: Array<IFMatch.context>) : boolean { return innerArr.length > 0});
  // as Array<Array<IFMatch.context>>
  return res;
}

import * as inputFilterRules from './inputFilterRules';

var rm;

function getRMOnce() {
  if (!rm) {
    rm = inputFilterRules.getRuleMap()
  }
  return rm;
}

export function applyRules(context : IFMatch.context) : Array<IFMatch.context> {
  var bestN : Array<IFMatch.context> = [context];
  inputFilterRules.oKeyOrder.forEach(function (sKey : string) {
     var bestNext: Array<Array<IFMatch.context>> = [];
     bestN.forEach(function(oContext : IFMatch.context) {
       if (oContext[sKey]) {
          debuglog('** applying rules for ' + sKey)
          var res = augmentContext(oContext, getRMOnce()[sKey] || [])
          debuglog('** result for ' + sKey + ' = ' + JSON.stringify(res, undefined, 2))
          bestNext.push(res || [])
       } else {
         // rule not relevant
         bestNext.push([oContext]);
       }
    })
    bestN = takeTopN(bestNext);
  });
  return bestN
}


export function applyRulesPickFirst(context : IFMatch.context) : IFMatch.context {
  var r = applyRules(context);
  return r && r[0];
}

/**
 * Decide whether to requery for a contet
 */
export function decideOnReQuery( context : IFMatch.context) : Array<IFMatch.context> {
  return []
}
