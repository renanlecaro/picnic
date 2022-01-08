import {diffLength} from "./diffLength";

describe('diffLength', ()=>{
  test('simple', ()=>{
    expect(diffLength("aaa", "bbb", "aaa", "name")).toEqual({
      editSize: 3,
      commonCharsAfter: 0,
      name: "name",
      score: -3,
    });
  })
  test('no b', ()=>{
    expect(diffLength("aaa", "", "aaa", "name")).toEqual({
      editSize: 3,
      commonCharsAfter: 0,
      name: "name",
      score: -3,
    });
  })
  test('no a', ()=>{
    expect(diffLength("", "bbb", "aaa", "name")).toEqual(null);
  })
  test('no c', ()=>{
    expect(diffLength("aaa", "bbb", "", "name")).toEqual(null);
  })
  test('real', ()=>{
    expect(diffLength("aaa xDDDD", "xDDDD", "aaa xDDDD", "name")).toEqual({ editSize: 4, commonCharsAfter: 5, name: "name", score: 4996 });
  })

})
