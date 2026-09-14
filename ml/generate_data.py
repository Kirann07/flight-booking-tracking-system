import pandas as pd
import random

data = []

cab_types = ["bike", "auto", "cab"]

for _ in range(1000):  # 1000 samples
    distance = random.randint(1, 30)  # km
    cab_type = random.choice(cab_types)
    hour = random.randint(0, 23)

    # demand based on time
    if 8 <= hour <= 11:
        demand = 1.3
    elif 17 <= hour <= 21:
        demand = 1.5
    elif hour >= 22 or hour <= 5:
        demand = 1.2
    else:
        demand = 1.0

    # base pricing
    if cab_type == "bike":
        base = 20
        rate = 8
    elif cab_type == "auto":
        base = 30
        rate = 10
    else:
        base = 50
        rate = 15

    price = (base + distance * rate) * demand

    # add noise
    price += random.uniform(-10, 10)

    data.append([distance, cab_type, hour, demand, round(price)])

df = pd.DataFrame(data, columns=["distance", "cab_type", "hour", "demand", "price"])

df.to_csv("cab_data.csv", index=False)

print("Dataset created: cab_data.csv")