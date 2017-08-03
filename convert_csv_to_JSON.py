import pandas as pd
df = pd.read_csv('small16.csv')
df = df.ix[:, 5:8]                                          # exclude irrelevant cols
df.columns = ['longitude', 'latitude', 'date']              # name cols
df['date'] = pd.to_datetime(df['date'])                     # create pandas date obj
df = df.sort_values(by='date')                              # sort CSV by date (important for animation!)
df['date'] = df['date'].dt.strftime('%Y-%m-%dT%H:%M:%S')    # convert date to format that our website likes
df.to_json('data.json', orient='records')                   # dump json :-)