from sklearn.neighbors import KNeighborsRegressor
from sklearn.metrics import mean_squared_error
import numpy as np
import pandas as pd

n_features = 5

# training data
data_train = pd.read_csv("data/train.csv", comment="#", delimiter=",")
Xtrain, ytrain = data_train.iloc[:,:-1], data_train.iloc[:,-1]
print("Loaded training data: n=%i, d=%i" % (Xtrain.shape[0], Xtrain.shape[1]))

# validation data
data_validation = pd.read_csv("data/validation.csv", comment="#", delimiter=",")
Xval, yval = data_validation.iloc[:,:-1], data_validation.iloc[:,-1]
print("Loaded validation data: n=%i, d=%i" % (Xval.shape[0], Xval.shape[1]))

# backward selection
model = KNeighborsRegressor(n_neighbors=10, algorithm="kd_tree")


feature_list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

for i in range(len(list(feature_list))):
    predictions = []  # rest prediction array
    # do predictions
    for j in range(len(list(feature_list))):
        rdcd_lst = np.delete(feature_list, j)
        model.fit(Xtrain.iloc[:, rdcd_lst], ytrain)
        y_pred = model.predict(Xval.iloc[:, rdcd_lst])
        y_true = yval
        mse = mean_squared_error(y_true, y_pred)
        predictions.append(mse)
    # compare preds and remove lowest value
    preds_sorted = np.sort(predictions)   # sort ascending
    lowest_val = preds_sorted[0]    # find minimum value
    f_to_drop = predictions.index(lowest_val)    # get index of lowest value
    feature_list = np.delete(feature_list, f_to_drop)  # rem lowest value
    print("Length of feature_list: %i" % len(feature_list))
    print("Average MSE: %f" % np.array(predictions).mean())

    if len(feature_list) == n_features:
        print feature_list
        break

# testing phase
data_test = pd.read_csv("data/test.csv", comment="#", delimiter=",")
Xtest, ytest = data_test.iloc[:,:-1], data_test.iloc[:,-1]
print("Loaded test data: n=%i, d=%i" % (Xtest.shape[0], Xtest.shape[1]))
model = KNeighborsRegressor(n_neighbors=10, algorithm="kd_tree")
model.fit(Xtrain.iloc[:, feature_list], ytrain)
y_pred = model.predict(Xtest.iloc[:, rdcd_lst])
y_true = ytest
mse = mean_squared_error(y_true, y_pred)
print("MSE with final feature list: %f" % mse)