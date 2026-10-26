import json
import time 
import os
import httpx

URL = "http://127.0.0.1:8000/parse"
path = os.path.join(os.path.dirname(__file__), "cases.json")
cases = json.load(open(path, encoding="utf-8"))
passed = 0

for c in cases:
    time.sleep(15)
    out = {}
    try:
        r = httpx.post(URL, json={"text": c["input"]}, timeout=90)
        if r.status_code == 200:
            out = r.json()
        else:
            print("HTTP", r.status_code, "for case", c["id"])
    except Exception as e:
        print("ERROR case", c["id"], repr(e)[:120])

    exp = c["expected"]
    amount_ok = str(out.get("amount")) in (str(exp["amount"]), f'{exp["amount"]}.00')
    ok = (out.get("debit_account") == exp["debit_account"]
          and out.get("credit_account") == exp["credit_account"]
          and amount_ok)
    passed += ok
    print(f'{c["id"]:>2} {"PASS" if ok else "FAIL"}  {c["input"]}  -> '
          f'{out.get("debit_account")} / {out.get("credit_account")} / {out.get("amount")}')

print(f"\nAccuracy: {passed}/{len(cases)}")