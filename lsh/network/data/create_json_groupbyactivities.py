import json
import numpy
import pandas as pd

csvData = pd.read_csv("rf15_health.csv", delimiter=",")
jsonData = "rf15.json"


with open(jsonData) as data_file:
    data = json.load(data_file)

for n in data["nodes"]:
    jsonUser = int(n["id"])
    print ("group", n["group"])
    print ("user", jsonUser)
    n["group"] = csvData.loc[csvData["user_id"] == jsonUser]["mostcommonactivity"].values[0]

print(type(data))

with open('rf15_health.json', 'w') as data_file:
    json.dump(data, data_file)
    data_file.close