import NExp from './nexp'

(() => {
  const reg = new NExp(/ab.d\./);

  console.log(reg.test('_abd222 abcd.'));
  console.log(reg.exec('_abd ab.d 222 abcd.'));
})()