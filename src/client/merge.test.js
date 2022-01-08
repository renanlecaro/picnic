
import {merge} from "./merge";

describe('merge', () => {
  //merge(old, remote, local, selections = [], offsetL = 0)


// for brievery, we write the test name as REMOTE_OP/LOCAL_OP

  const old = "i like big cars";
  test("add/null", () => {
      expect(
        merge(old, "i REALLY like big cars", old)).toEqual(
        "i REALLY like big cars")
    }
  );
  test("edi/null", () => {
      expect(
        merge(old, "i LOVE big cars", old)).toEqual(
        "i LOVE big cars")
    }
  );
  test("del/null", () => {
      expect(
        merge(old, "i love cars", old)).toEqual(
        "i love cars")
    }
  );

  test("null/add", () => {
      expect(
        merge(old, old, "i REALLY like big cars")).toEqual(
        "i REALLY like big cars")
    }
  );
  test("null/edi", () => {
      expect(
        merge(old, old, "i LOVE big cars")).toEqual(
        "i LOVE big cars")
    }
  );
  test("null/del", () => {
      expect(
        merge(old, old, "i love cars")).toEqual(
        "i love cars")
    }
  );

  test("add/add", () => {
      expect(
        merge(old, "i REALLY like big cars", "i like big cars AND TRUCKS")).toEqual(
        "i REALLY like big cars AND TRUCKS")
    }
  );
  test("add/edi", () => {
      expect(
        merge(old, "i REALLY like big cars", "i like big TRUCKS")).toEqual(
        "i REALLY like big TRUCKS")
    }
  );
  test("add/del", () => {
      expect(
        merge(old, "i REALLY like big cars", "i like cars")).toEqual(
        "i REALLY like cars")
    }
  );

  test("edi/add", () => {
      expect(
        merge(old, "i LOVE big cars", "i like big cars AND TRUCKS")).toEqual(
        "i LOVE big cars AND TRUCKS")
    }
  );
  test("edi/edi", () => {
      expect(
        merge(old, "i LOVE big cars", "i like big TRUCKS")).toEqual(
        "i LOVE big TRUCKS")
    }
  );
  test("edi/del", () => {
      expect(
        merge(old, "i LOVE big cars", "i like cars")).toEqual(
        "i LOVE cars")
    }
  );

  test("del/add", () => {
      expect(
        merge(old, "i like cars", "i like big cars AND TRUCKS")).toEqual(
        "i like cars AND TRUCKS")
    }
  );
  test("del/edi", () => {
      expect(
        merge(old, "i like cars", "i like big TRUCKS")).toEqual(
        "i like TRUCKS")
    }
  );
  test("del/del", () => {
      expect(
        merge(old, "like big cars", "i like big")).toEqual(
        "like big")
    }
  );

  test("del/null", () => {
      expect(
        merge(old, "", old)).toEqual(
        "")
    }
  );
  test("del/null", () => {
      expect(
        merge(old, "big cars", old)).toEqual(
        "big cars")
    }
  );
  test("typing concurrently", () => {
    const old="Shopping list : \nTomatoes"
    const remote1="Shopping list : \nPot\nTomatoes"
    const remote2="Shopping list : \nPotatoes\nTomatoes"

    const local1="Shopping list : \nTomatoes\nRad"



    const firstMerge = merge(old, remote1,local1)
    // remote changes are recieved, then local user finishes his word
    const secondMerge = merge(remote1, remote2,firstMerge+'ishes')

    expect(firstMerge).toEqual(`Shopping list : 
Pot
Tomatoes
Rad`)
    expect(secondMerge).toEqual(
`Shopping list : 
Potatoes
Tomatoes
Radishes`)


  });


})
