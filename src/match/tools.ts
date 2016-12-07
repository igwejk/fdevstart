/**
 * @file toolmatcher
 * @module jfseb.fdevstart.toolmatcher
 * @copyright (c) Gerd Forstmann
 *
 * Match a tool record on a sentence,
 *
 * This will unify matching required and optional category words
 * with the requirements of the tool.
 *
 */

// / <reference path="../../lib/node-4.d.ts" />

import * as debug from 'debug';
import * as IMatch from './ifmatch';



var oToolFLPD = { 'name' : 'FLPD',
  'requires' : { 'systemId' : {}, 'client' :{}},
  'optional' : { 'fiori catalog' : {}, 'fiori group' :{}}
};

var oToolFLP = { 'name' : 'FLP',
  'requires' : { 'systemId' : {}, 'client' :{}},
  'optional' : { 'intent' : {} }
};

var oToolTA = { 'name' : 'StartTA',
  'requires' : { 'transaction' : {}, 'systemId' : {}, 'client' :{}},
  'optional' : { }
};

var oToolWiki = { 'name' : 'wiki',
  'requires' : { 'wiki' : {} },
  'optional' : { 'wikipage' : {} }
};

var oToolWikiPage = { 'name' : 'WikiPage',
  'requires' : { 'wikipage' : {} }
};


const tools = [oToolWiki, oToolTA, oToolFLPD, oToolWikiPage, oToolFLP];

export function getTools() {
  return tools;
};
