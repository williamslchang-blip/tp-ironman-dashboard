import json

with open(r'C:\Users\User\Desktop\TP\m45_all_65_ranked.json', 'r', encoding='utf-8') as f:
    ranked = json.load(f)

# Let's inspect evidenceLabel or bestResult for some tiers
print(f"{'Idx':<4} | {'Name':<22} | {'Score':<6} | {'Evidence / Best Result'}")
print("-" * 80)
for i in [0, 1, 2, 4, 7, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 64]:
    a = ranked[i]
    ev = a.get('evidenceLabel') or a.get('bestResult') or a.get('previousEditionResult') or 'None'
    print(f"{i+1:<4} | {a.get('fullName'):<22} | {a.get('score'):<6.1f} | {ev}")
