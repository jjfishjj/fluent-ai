(function (root) {
  'use strict';
  const VERSION = 'genius-1.0';
  const KEYS = ['s','ab','d','im','k','a','r','v','cn','pf','an','na'];

  function scoreAnswerKeys(answerKeys, calibration) {
    const scores = Object.fromEntries(KEYS.map(function (key) { return [key, 0]; }));
    answerKeys.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(scores, key)) throw new Error('Unknown MemGenius score key: ' + key);
      scores[key] += 2;
    });
    calibration = calibration || {};
    if (calibration.done) {
      const rt = calibration.avgRt;
      const acc = calibration.memAcc;
      if (Number.isFinite(rt) && rt >= 0) {
        if (rt < 650) scores.im += 3;
        else if (rt < 850) scores.im += 1;
        else if (rt > 1100) scores.d += 2;
      }
      if (Number.isFinite(acc) && acc >= 0 && acc <= 1) {
        if (acc >= .8) scores.ab += 2;
        else if (acc < .5) scores.s += 1;
      }
    }
    const xScore = scores.ab - scores.s;
    const yScore = scores.d - scores.im;
    const quadrant = xScore <= 0 && yScore >= 0 ? 'innovation' : xScore > 0 && yScore >= 0 ? 'perception' : xScore <= 0 ? 'integration' : 'action';
    let primary, secondary;
    if (quadrant === 'innovation') [primary,secondary] = scores.k >= scores.a ? ['explorer','melodist'] : ['melodist','explorer'];
    else if (quadrant === 'perception') [primary,secondary] = scores.r+scores.an >= scores.na+scores.a ? ['architect','narrator'] : ['narrator','architect'];
    else if (quadrant === 'integration') [primary,secondary] = scores.cn >= scores.pf ? ['connector','performer'] : ['performer','connector'];
    else [primary,secondary] = scores.an >= scores.v ? ['analyst','visionary'] : ['visionary','analyst'];
    return {assessmentVersion:VERSION,scores:scores,d:scores,xScore:xScore,yScore:yScore,quadrant:quadrant,quad:quadrant,primary:primary,secondary:secondary};
  }

  root.MemGeniusScoring = { VERSION:VERSION, scoreAnswerKeys:scoreAnswerKeys };
})(typeof globalThis !== 'undefined' ? globalThis : window);

