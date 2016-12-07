
/**
 * @file algol.ts
 *
 * Constant determining the algorithm
 */


/**
 * levenshtein distances above this will not be considered valid
 */
export const Cutoff_LevenShtein : number = 150;



/**
 * Weight factor to use on the a given word distance
 * of 0, 1, 2, 3 ....
 */
export const aReinforceDistWeight: Array<number> = [0.1, 0.1, 0.05, 0.02];

/**
 * only the top n words are considered
 */
export const Top_N_WordCategorizations = 5;


