#!/usr/bin/env python3
"""Rebuild the `papers` part of data.js from the master CSV.
Usage: python3 tools/build_data.py path/to/Master_Database.csv
Subject names/codes/years in data.js are kept; only paper links are regenerated.
Rows with an empty Drive Link are skipped."""
import csv, json, re, sys
from collections import defaultdict
csv_path = sys.argv[1]
src = open('data.js', encoding='utf-8').read()
m = re.search(r'const PROGRAM=(\[.*?\n\]);\n', src, re.S)
program = json.loads(m.group(1))
papers = defaultdict(lambda: defaultdict(list))
for r in csv.DictReader(open(csv_path, encoding='utf-8-sig')):
    link = r['Drive Link'].strip()
    if not link:
        continue
    papers[r['Subject Code'].strip()][r['Exam Year'].strip()].append(
        {'t': r['Type'].strip(), 's': r['Set'].strip(), 'l': link})
known = set()
for y in program:
    for s in y['subjects']:
        known.add(s['code'])
        by = papers.get(s['code'], {})
        s['papers'] = {yr: sorted(by[yr], key=lambda p: (p['t'] != 'Written', p['s']))
                       for yr in sorted(by, reverse=True)}
unknown = set(papers) - known
if unknown:
    sys.exit('Unknown subject codes in CSV: %s' % sorted(unknown))
out = src[:m.start()] + 'const PROGRAM=' + json.dumps(program, indent=1, ensure_ascii=False) + ';\n' + src[m.end():]
open('data.js', 'w', encoding='utf-8').write(out)
print('papers written:', sum(len(v) for s in papers.values() for v in s.values()))
