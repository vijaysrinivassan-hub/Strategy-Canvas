import csv
import json
import os
import re
import sys
from collections import defaultdict

CLIENT = "AI Data Platform"
PRODUCT_ID = "0jgsw8bx554d"
REVISION = "ai-data-search-suggestions-v1"

PROCESSES = [
    "Analysis", "Descriptive analysis", "Diagnostic analysis", "Cohort analysis",
    "Funnel analysis", "Attribution analysis", "Segmentation analysis",
    "Retention and churn analysis", "Customer lifetime-value analysis",
    "Product and SKU performance analysis", "Marketing-performance analysis",
    "Revenue and profitability analysis", "Anomaly and trend analysis",
    "Root-cause analysis", "Comparative analysis",
]
DEPARTMENTS = ["Marketing", "Product", "Sales", "Finance"]
LENSES = ["process", "output", "outcome", "benefits", "tools"]


def normalize(value):
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").strip().lower()).strip()


def number(value, integer=False):
    value = str(value or "").strip().replace(",", "")
    if not value:
        return None
    try:
        parsed = float(value)
        return int(parsed) if integer else parsed
    except ValueError:
        return None


def classify(keyword, parent, category):
    text = normalize(" ".join([keyword, parent, category]))
    if re.search(r"\b(tool|tools|software|platform|system|systems|app|apps|solution|solutions)\b", text):
        lens = "tools"
    elif re.search(r"\b(benefit|benefits|advantage|advantages|roi|saving|savings|efficiency|efficient|faster)\b", text):
        lens = "benefits"
    elif re.search(r"\b(outcome|outcomes|result|results|growth|increase|improve|improvement|visibility|revenue|profit|conversion)\b", text):
        lens = "outcome"
    elif re.search(r"\b(report|reports|reporting|dashboard|dashboards|scorecard|summary|template|templates|forecast|forecasts|alert|alerts)\b", text):
        lens = "output"
    else:
        lens = "process"

    process_patterns = [
        ("Root-cause analysis", r"root cause|causal"),
        ("Customer lifetime-value analysis", r"lifetime value|customer value|\bclv\b|\bltv\b"),
        ("Retention and churn analysis", r"retention|churn|customer loyalty"),
        ("Attribution analysis", r"attribution|incrementality|channel contribution"),
        ("Funnel analysis", r"funnel|drop off|dropoff|conversion path"),
        ("Cohort analysis", r"cohort"),
        ("Segmentation analysis", r"segment|audience|persona|cluster"),
        ("Product and SKU performance analysis", r"\bsku\b|product performance|assortment|inventory"),
        ("Marketing-performance analysis", r"marketing performance|campaign|marketing analytics|ad performance"),
        ("Revenue and profitability analysis", r"revenue|profit|margin|financial analysis|finance analytics|cost analysis"),
        ("Anomaly and trend analysis", r"anomal|outlier|trend|variance|spike|change detection"),
        ("Diagnostic analysis", r"diagnostic|diagnosis|why did|driver analysis|explain.*change"),
        ("Descriptive analysis", r"descriptive|historical analysis|what happened"),
        ("Comparative analysis", r"comparative|comparison|compare|versus|\bvs\b|benchmark"),
    ]
    process = next((name for name, pattern in process_patterns if re.search(pattern, text)), "Analysis")

    department_patterns = [
        ("Finance", r"finance|financial|revenue|profit|margin|cost|budget|stock|investment|accounting"),
        ("Sales", r"sales|lead|pipeline|deal|crm|account executive"),
        ("Marketing", r"marketing|campaign|channel|advertis|\bseo\b|content|email|social media|audience"),
        ("Product", r"product|user|feature|\bsku\b|inventory|customer experience|engagement"),
    ]
    department = next((name for name, pattern in department_patterns if re.search(pattern, text)), "Product")
    return process, department, lens


def choose(rows, field):
    ranked = sorted(rows, key=lambda row: (sum(bool(value) for value in row.values()), row.get("Last Update", "")), reverse=True)
    return next((row.get(field, "").strip() for row in ranked if row.get(field, "").strip()), "")


def build(paths):
    grouped = defaultdict(list)
    for path in paths:
        with open(path, encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                row["_source"] = os.path.basename(path)
                grouped[(normalize(row.get("Keyword")), normalize(row.get("Country") or "us"))].append(row)

    records = []
    for (_, _), rows in grouped.items():
        keyword = choose(rows, "Keyword")
        country = choose(rows, "Country") or "us"
        parent = choose(rows, "Parent Keyword")
        category = choose(rows, "Category")
        process, department, lens = classify(keyword, parent, category)
        data = {
            "source_rank": choose(rows, "#"),
            "cps": number(choose(rows, "CPS")),
            "last_update": choose(rows, "Last Update"),
            "serp_features": choose(rows, "SERP Features"),
            "global_volume": number(choose(rows, "Global volume"), True),
            "global_traffic_potential": number(choose(rows, "Global traffic potential"), True),
            "first_seen": choose(rows, "First seen"),
            "languages": choose(rows, "Languages"),
            "sv_trend": choose(rows, "SV trend (10-2024 - 09-2026)"),
            "sv_forecasting_trend": choose(rows, "SV Forecasting trend (10-2026 - 10-2027)"),
            "category": category,
            "source_files": sorted({row["_source"] for row in rows}),
            "source_rows": [row.get("#", "") for row in rows],
        }
        records.append({
            "keyword": keyword,
            "country": country,
            "volume": number(choose(rows, "Volume"), True),
            "kd": number(choose(rows, "Difficulty")),
            "cpc": number(choose(rows, "CPC")),
            "traffic_potential": number(choose(rows, "Traffic potential"), True),
            "parent_topic": parent,
            "intent": choose(rows, "Intents"),
            "data": {key: value for key, value in data.items() if value not in (None, "", [])},
            "process": process,
            "department": department,
            "lens": lens,
        })
    return sorted(records, key=lambda row: (row["process"], row["department"], row["lens"], row["keyword"].lower()))


def emit(records, destination):
    payload = json.dumps(records, separators=(",", ":"), ensure_ascii=False)
    source = f"""/* Generated from the five Ahrefs search-suggestion CSV exports supplied on 2026-10-04. */
(function(root,factory){{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AiDataSearchMetrics=api;}})(typeof globalThis!=='undefined'?globalThis:this,function(){{
const REVISION={json.dumps(REVISION)},CLIENT={json.dumps(CLIENT)},PRODUCT_ID={json.dumps(PRODUCT_ID)},records={payload};
const normalize=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const key=(keyword,country)=>normalize(keyword)+'|'+String(country||'us').toLowerCase();
function keywordRows(){{return records.map(record=>({{keyword:record.keyword,country:record.country,volume:record.volume,kd:record.kd,cpc:record.cpc,traffic_potential:record.traffic_potential,parent_topic:record.parent_topic,intent:record.intent,data:record.data}}));}}
function matches(client,productId){{return normalize(client)===normalize(CLIENT)&&String(productId||'')===PRODUCT_ID;}}
function apply(root,keywordRowsFromDb){{
 const view=root?.views?.value;if(!view)return false;const rows=(view.rows||[]).filter(row=>row.pageGroup==='matrix'),columns=view.pageColumns?.matrix||view.columns||[];
 const rowByName=new Map(rows.map(row=>[normalize(row.name),row])),columnByName=new Map(columns.map(column=>[normalize(column.name),column])),byKeyword=new Map((keywordRowsFromDb||[]).map(row=>[key(row.keyword,row.country),row]));
 const imported=new Set(records.map(record=>String(byKeyword.get(key(record.keyword,record.country))?.id||'')).filter(Boolean));let changed=false;
 for(const row of rows)for(const cell of Object.values(row.cells||{{}})){{const before=JSON.stringify([cell.kws,cell.valueLensKeywords]);cell.kws=(cell.kws||[]).filter(id=>!imported.has(String(id)));for(const lens of Object.keys(cell.valueLensKeywords||{{}}))cell.valueLensKeywords[lens]=(cell.valueLensKeywords[lens]||[]).filter(id=>!imported.has(String(id)));if(before!==JSON.stringify([cell.kws,cell.valueLensKeywords]))changed=true;}}
 for(const record of records){{const row=rowByName.get(normalize(record.process)),column=columnByName.get(normalize(record.department)),keyword=byKeyword.get(key(record.keyword,record.country));if(!row||!column||keyword?.id==null)continue;row.cells||={{}};const cell=row.cells[column.id]&&typeof row.cells[column.id]==='object'?row.cells[column.id]:(row.cells[column.id]={{mode:'aeo',cfg:true,kws:[],pageUrls:[]}});const target=record.lens==='process'?(cell.kws||=[]):((cell.valueLensKeywords||={{}})[record.lens]||=[]);if(!target.map(String).includes(String(keyword.id))){{target.push(keyword.id);changed=true;}}}}
 return changed;
}}
return {{REVISION,CLIENT,PRODUCT_ID,records,keywordRows,matches,apply}};
}});
"""
    with open(destination, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(source)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("Usage: build-ai-data-search-metrics.py OUTPUT INPUT.csv [INPUT.csv ...]")
    built = build(sys.argv[2:])
    emit(built, sys.argv[1])
    print(json.dumps({"records": len(built), "output": sys.argv[1]}))
