from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path


LIB_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = LIB_ROOT.parents[0]
SOURCE_ROOT = LIB_ROOT.parents[1]
DATA_DIR = LIB_ROOT / "data"
CONTENT_DIR = LIB_ROOT / "content"
SLIDE_DIR = LIB_ROOT / "assets" / "images" / "slide-previews"

sys.path.insert(0, str(SOURCE_ROOT / "tools"))

try:
    from update_smart_site_html_chapter8 import DOMAINS
except Exception as exc:  # pragma: no cover - used as a maintenance script
    raise SystemExit(f"Cannot import source smart-site domains: {exc}") from exc


DOMAIN_IMAGE = {
    1: "company-slide-27.jpg",
    2: "ai-slide-06.jpg",
    3: "linear-slide-045.jpg",
    4: "hydro-slide-083.jpg",
    5: "hydro-slide-093.jpg",
    6: "hydro-slide-117.jpg",
    7: "law-slide-14.jpg",
    8: "company-slide-32.jpg",
    9: "company-slide-07.jpg",
    10: "linear-slide-091.jpg",
}

SYSTEM_IMAGE_RULES = [
    (("AI", "视频", "巡检", "哨兵", "识别"), "ai-slide-06.jpg"),
    (("实名", "门禁", "考勤", "人员"), "company-slide-27.jpg"),
    (("工人驿站", "积分超市"), "company-slide-46.jpg"),
    (("安全教育", "VR"), "company-slide-14.jpg"),
    (("塔机", "吊钩", "激光"), "linear-slide-050.jpg"),
    (("龙门吊", "架桥机", "履带吊"), "linear-slide-045.jpg"),
    (("边坡", "护栏", "基坑", "高支模", "脚手架", "爬架"), "hydro-slide-083.jpg"),
    (("地磅", "物资", "车辆", "洗车"), "hydro-slide-129.jpg"),
    (("环境", "扬尘", "噪声", "能耗", "水电", "污水"), "hydro-slide-117.jpg"),
    (("移动执法", "固证", "单兵"), "law-slide-13.jpg"),
    (("隧道", "UWB", "有害气体", "安全步距", "应急电话", "广播"), "linear-slide-091.jpg"),
    (("桩机", "拌合站", "梁场", "摊铺", "压实", "大坝"), "hydro-slide-093.jpg"),
    (("无人机",), "linear-slide-148.jpg"),
    (("会议", "监控中心", "VR全景"), "company-slide-07.jpg"),
]

DECK_LABELS = {
    "company": "企业与平台材料",
    "ai": "AI安全生产大模型材料",
    "law": "移动执法固证材料",
    "linear": "线性工程材料",
    "hydro": "水利水电工程材料",
}

MATERIAL_TITLES = {
    "company-slide-01.jpg": "宇泛智能企业介绍封面",
    "company-slide-14.jpg": "AI安全生产大模型能力页",
    "company-slide-26.jpg": "AIoT平台能力页",
    "company-slide-27.jpg": "平台能力架构页",
    "company-slide-30.jpg": "智能硬件产品页",
    "company-slide-32.jpg": "解决方案总览页",
    "ai-slide-05.jpg": "AI哨兵能力介绍",
    "ai-slide-06.jpg": "AI安全生产大模型系统架构",
    "ai-slide-07.jpg": "移动巡检业务流程",
    "ai-slide-16.jpg": "AI Agent平台能力",
    "law-slide-13.jpg": "移动执法固证系统架构",
    "law-slide-15.jpg": "执法终端产品介绍",
    "linear-slide-138.jpg": "线性工程智慧工地架构",
    "linear-slide-148.jpg": "AI巡检在线性工程中的应用",
    "hydro-slide-020.jpg": "水利水电工程智慧化方案",
    "hydro-slide-093.jpg": "拌合站与压实监测场景",
    "hydro-slide-117.jpg": "绿色施工与环境监测场景",
}


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def plain_list(value) -> list[str]:
    if not value:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [str(value).strip()]


def image_path(filename: str) -> str:
    return f"assets/images/slide-previews/{filename}"


def pick_system_image(title: str, domain_idx: int) -> str:
    for keywords, filename in SYSTEM_IMAGE_RULES:
        if any(keyword in title for keyword in keywords):
            return image_path(filename)
    return image_path(DOMAIN_IMAGE.get(domain_idx, "company-slide-32.jpg"))


def keyword_tags(title: str, domain_name: str) -> list[str]:
    tags = {domain_name, "智慧工地", "子系统"}
    rules = [
        ("AI", "AI识别"),
        ("视频", "视频监控"),
        ("人员", "人员管理"),
        ("实名", "实名制"),
        ("安全", "安全生产"),
        ("机械", "机械设备"),
        ("塔机", "起重机械"),
        ("环境", "绿色施工"),
        ("隧道", "隧道工程"),
        ("移动执法", "移动执法"),
        ("质量", "质量管理"),
        ("物资", "物资管理"),
        ("大坝", "水利水电"),
        ("压实", "压实监测"),
    ]
    for key, tag in rules:
        if key in title:
            tags.add(tag)
    return sorted(tags)


def markdown_for_system(system: dict) -> str:
    def bullets(items: list[str]) -> str:
        return "\n".join(f"- {item}" for item in items) if items else "- 待补充"

    return "\n".join(
        [
            f"# {system['number']} {system['title']}",
            "",
            "## 系统概述",
            system.get("overview") or "待补充",
            "",
            "## 系统组成",
            bullets(system.get("components", [])),
            "",
            "## 核心功能",
            bullets(system.get("functions", [])),
            "",
            "## 系统亮点",
            bullets(system.get("highlights", [])),
            "",
            "## 应用价值",
            system.get("value") or "待补充",
            "",
            "## 素材说明",
            system.get("mediaNote") or "待补充",
            "",
            "## 资料来源",
            system.get("source") or "正式方案结构化内容",
            "",
        ]
    )


def build_systems() -> tuple[list[dict], list[dict]]:
    systems: list[dict] = []
    domains: list[dict] = []
    for domain_idx, domain in enumerate(DOMAINS, 1):
        domain_id = f"domain-8-{domain_idx}"
        domain_record = {
            "id": domain_id,
            "number": f"8.{domain_idx}",
            "name": domain.get("name", ""),
            "intro": domain.get("intro", ""),
            "cover": image_path(DOMAIN_IMAGE.get(domain_idx, "company-slide-32.jpg")),
            "systemIds": [],
        }
        for system_idx, item in enumerate(domain.get("systems", []), 1):
            number = f"8.{domain_idx}.{system_idx}"
            system_id = f"system-8-{domain_idx}-{system_idx}"
            title = item.get("name", "")
            record = {
                "id": system_id,
                "number": number,
                "domainId": domain_id,
                "domainNumber": domain_record["number"],
                "domainName": domain_record["name"],
                "title": title,
                "summary": item.get("overview", "")[:180],
                "overview": item.get("overview", ""),
                "components": plain_list(item.get("components")),
                "functions": plain_list(item.get("functions")),
                "highlights": plain_list(item.get("highlights")),
                "value": item.get("value", ""),
                "mediaNote": item.get("media", ""),
                "source": item.get("source", "正式方案结构化内容"),
                "cover": pick_system_image(title, domain_idx),
                "images": [pick_system_image(title, domain_idx)],
                "tags": keyword_tags(title, domain_record["name"]),
                "permission": "public",
                "status": "基准版",
                "content": f"content/systems/{system_id}.md",
                "formalHref": "assets/documents/smart-site-whitepaper-architecture.html#chapter-8",
            }
            domain_record["systemIds"].append(system_id)
            systems.append(record)
            write_text(CONTENT_DIR / "systems" / f"{system_id}.md", markdown_for_system(record))
        domains.append(domain_record)
    return systems, domains


def build_media() -> list[dict]:
    manifest_path = SLIDE_DIR / "manifest.json"
    if not manifest_path.exists():
        return []
    raw = json.loads(manifest_path.read_text(encoding="utf-8"))
    records = []
    for idx, item in enumerate(raw, 1):
        filename = Path(item["src"]).name
        deck = item.get("deck", "material")
        page = item.get("page", idx)
        records.append(
            {
                "id": f"media-{deck}-{page}",
                "title": MATERIAL_TITLES.get(filename, f"{DECK_LABELS.get(deck, deck)} 第{page}页"),
                "deck": deck,
                "deckName": DECK_LABELS.get(deck, deck),
                "page": page,
                "type": "PPT预览图",
                "src": image_path(filename),
                "permission": "public",
                "status": "已导入",
                "usage": ["方案配图", "素材库"],
            }
        )
    return records


def build_platforms() -> list[dict]:
    return [
        {
            "id": "platform-smart-construction",
            "title": "AI数智建设综合管理平台",
            "subtitle": "项目级、企业级一体化智慧工地管理底座",
            "summary": "围绕项目总览、人员管理、机械设备、安全生产、质量技术、绿色施工、物资计量、视频监控和多项目管控等业务，形成面向建设工程的综合管理平台。",
            "cover": image_path("company-slide-27.jpg"),
            "tags": ["平台产品", "智慧工地", "多项目管理"],
            "permission": "public",
            "links": [{"label": "平台展示页", "href": "../pump-storage-smart-platform-dashboard.html"}],
            "capabilities": ["项目驾驶舱", "多组织管理", "业务子系统集成", "数据看板", "移动端协同"],
        },
        {
            "id": "platform-ai-safety-model",
            "title": "AI安全生产大模型",
            "subtitle": "面向施工现场隐患识别、巡检闭环和多项目监管的AI能力平台",
            "summary": "支持影像智巡、移动巡检、AI哨兵、设备接入与管理、巡检闭环、多项目组织管理和模型路由能力，适合集团化项目和分散工地统一管控。",
            "cover": image_path("ai-slide-06.jpg"),
            "tags": ["平台产品", "AI安全生产", "U安智巡"],
            "permission": "public",
            "links": [{"label": "U安智巡", "href": "https://safety.uni-ubi.com/homepage"}],
            "capabilities": ["AI巡检识别", "设备接入与管理", "巡检闭环", "多项目管理", "模型能力扩展"],
        },
        {
            "id": "platform-aiot-open",
            "title": "AIoT开放平台",
            "subtitle": "设备接入、算法能力、数据接口和生态集成能力",
            "summary": "为智慧工地各类硬件、AI能力和业务系统提供统一接入、统一管理、统一数据输出能力，支撑后续系统扩展和第三方集成。",
            "cover": image_path("company-slide-26.jpg"),
            "tags": ["平台产品", "AIoT", "开放接口"],
            "permission": "internal",
            "links": [],
            "capabilities": ["设备接入", "接口开放", "算法管理", "能力快照", "运维监控"],
        },
    ]


def build_solutions(systems: list[dict]) -> list[dict]:
    all_ids = [item["id"] for item in systems]
    by_domain = {}
    for item in systems:
        by_domain.setdefault(item["domainId"], []).append(item["id"])
    return [
        {
            "id": "solution-smart-site-base",
            "title": "宇泛AI数智建整体解决方案",
            "subtitle": "旗舰版 + 需求定制版的基础基准方案",
            "industry": "综合建设工程",
            "summary": "作为面向客户输出的基准方案，覆盖平台底座、AI安全生产大模型、人员管理、安全生产、危大工程、机械设备、质量技术、绿色施工、物资计量、视频协同、专项场景和实施运维保障。",
            "cover": image_path("company-slide-32.jpg"),
            "permission": "public",
            "systemIds": all_ids,
            "documentIds": ["doc-formal-html"],
            "platformIds": ["platform-smart-construction", "platform-ai-safety-model", "platform-aiot-open"],
            "content": "content/solutions/solution-smart-site-base.md",
        },
        {
            "id": "solution-ai-safety",
            "title": "AI安全生产大模型应用方案",
            "subtitle": "AI巡检识别、设备接入、闭环整改与多项目监管",
            "industry": "安全生产",
            "summary": "面向施工现场视频、图片和移动巡检场景，将隐患识别、任务派发、整改反馈和记录留痕形成闭环。",
            "cover": image_path("ai-slide-06.jpg"),
            "permission": "public",
            "systemIds": [s["id"] for s in systems if any(k in s["title"] for k in ["AI", "视频", "巡检", "无人机"])],
            "documentIds": ["doc-ai-product-material"],
            "platformIds": ["platform-ai-safety-model"],
            "content": "content/solutions/solution-ai-safety.md",
        },
        {
            "id": "solution-hydro",
            "title": "水利水电工程智慧化方案",
            "subtitle": "抽蓄、水库、大坝、拌合站、压实与绿色施工场景",
            "industry": "水利水电",
            "summary": "围绕水利水电工程现场安全、质量、进度、机械、环境和专项监测场景，沉淀可复用的行业方案素材。",
            "cover": image_path("hydro-slide-020.jpg"),
            "permission": "internal",
            "systemIds": by_domain.get("domain-8-10", []) + by_domain.get("domain-8-7", []) + by_domain.get("domain-8-6", []),
            "documentIds": ["doc-hydro-material"],
            "platformIds": ["platform-smart-construction"],
            "content": "content/solutions/solution-hydro.md",
        },
        {
            "id": "solution-linear",
            "title": "线性工程安全数字化方案",
            "subtitle": "公路、铁路、管廊、隧道、桥梁等长距离工程场景",
            "industry": "线性工程",
            "summary": "针对多工点、长线路、人员设备分散和巡检难度高的工程场景，组织平台、AI巡检和专项监测能力。",
            "cover": image_path("linear-slide-138.jpg"),
            "permission": "internal",
            "systemIds": by_domain.get("domain-8-10", []) + by_domain.get("domain-8-3", []) + by_domain.get("domain-8-4", []),
            "documentIds": ["doc-linear-material"],
            "platformIds": ["platform-smart-construction", "platform-ai-safety-model"],
            "content": "content/solutions/solution-linear.md",
        },
        {
            "id": "solution-mobile-law",
            "title": "移动执法固证系统方案",
            "subtitle": "执法记录、证据留存、轨迹回传和远程协同",
            "industry": "专项应用",
            "summary": "面向移动巡查、执法固证、现场记录和远程协同场景，提供单兵终端、执法记录、数据回传和任务闭环能力。",
            "cover": image_path("law-slide-13.jpg"),
            "permission": "public",
            "systemIds": [s["id"] for s in systems if "移动执法" in s["title"]],
            "documentIds": ["doc-mobile-law-material"],
            "platformIds": ["platform-smart-construction"],
            "content": "content/solutions/solution-mobile-law.md",
        },
    ]


def build_documents() -> list[dict]:
    return [
        {
            "id": "doc-formal-html",
            "title": "宇泛AI数智建整体解决方案 HTML正式版",
            "type": "HTML方案",
            "summary": "由当前正式方案转换形成的长文档版本，适合完整阅读和客户方案预览。",
            "file": "assets/documents/smart-site-whitepaper-architecture.html",
            "permission": "public",
            "status": "已导入",
            "tags": ["正式方案", "整体方案", "HTML"],
        },
        {
            "id": "doc-ai-product-material",
            "title": "AI安全生产大模型产品材料",
            "type": "PPT源材料",
            "summary": "对应视觉AI硬件及Agent、U安智巡等产品介绍材料。当前公开库先导入预览图，源文件保留为内部资料。",
            "file": "",
            "permission": "internal",
            "status": "仅登记",
            "tags": ["AI安全生产", "U安智巡", "内部材料"],
        },
        {
            "id": "doc-mobile-law-material",
            "title": "移动执法固证系统解决方案材料",
            "type": "PPT源材料",
            "summary": "移动执法固证系统介绍材料。当前公开库先导入预览图，源文件保留为内部资料。",
            "file": "",
            "permission": "internal",
            "status": "仅登记",
            "tags": ["移动执法", "固证", "内部材料"],
        },
        {
            "id": "doc-hydro-material",
            "title": "水利水电工程智慧工地方案材料",
            "type": "PPT源材料",
            "summary": "水利水电、抽水蓄能等行业方案素材。当前公开库先导入预览图，源文件保留为内部资料。",
            "file": "",
            "permission": "internal",
            "status": "仅登记",
            "tags": ["水利水电", "抽水蓄能", "内部材料"],
        },
        {
            "id": "doc-linear-material",
            "title": "线性工程安全数字化方案材料",
            "type": "PPT源材料",
            "summary": "线性工程安全数字化管理材料。当前公开库先导入预览图，源文件保留为内部资料。",
            "file": "",
            "permission": "internal",
            "status": "仅登记",
            "tags": ["线性工程", "安全管理", "内部材料"],
        },
        {
            "id": "doc-delivery-template",
            "title": "实施交付、验收与运维资料模板",
            "type": "交付模板",
            "summary": "沉淀项目实施计划、验收标准、培训移交、运维响应和售后服务等通用内容模块。",
            "file": "content/delivery/implementation-acceptance-ops.md",
            "permission": "public",
            "status": "可编辑",
            "tags": ["实施交付", "验收标准", "运维响应"],
        },
    ]


def build_tags(systems: list[dict], solutions: list[dict], platforms: list[dict]) -> list[dict]:
    tag_set = set()
    for record in [*systems, *solutions, *platforms]:
        tag_set.update(record.get("tags", []))
        if record.get("industry"):
            tag_set.add(record["industry"])
    return [{"id": f"tag-{idx}", "name": name} for idx, name in enumerate(sorted(tag_set), 1)]


def build_relations(solutions: list[dict], systems: list[dict], platforms: list[dict]) -> dict:
    return {
        "solutionSystems": [
            {"solutionId": solution["id"], "systemIds": solution.get("systemIds", [])}
            for solution in solutions
        ],
        "solutionPlatforms": [
            {"solutionId": solution["id"], "platformIds": solution.get("platformIds", [])}
            for solution in solutions
        ],
        "systemMedia": [
            {"systemId": system["id"], "media": system.get("images", [])}
            for system in systems
        ],
        "platformMedia": [
            {"platformId": platform["id"], "media": [platform.get("cover")]}
            for platform in platforms
        ],
    }


def write_solution_markdown(solution: dict, systems: list[dict]) -> None:
    related = [s for s in systems if s["id"] in solution.get("systemIds", [])][:30]
    related_text = "\n".join(f"- {item['number']} {item['title']}" for item in related) or "- 待补充"
    text = "\n".join(
        [
            f"# {solution['title']}",
            "",
            f"## 方案定位",
            solution["summary"],
            "",
            "## 关联子系统",
            related_text,
            "",
            "## 后续维护",
            "本页为方案库结构化内容入口，后续可继续补充行业适配、典型场景、配置清单、实施边界和客户定制说明。",
            "",
        ]
    )
    write_text(LIB_ROOT / solution["content"], text)


def write_delivery_content() -> None:
    text = """# 实施交付、验收与运维资料模板

## 实施交付
项目实施宜按启动准备、现场踏勘、方案深化、设备安装、系统联调、试运行、培训移交和正式上线等阶段组织，形成节点计划、责任分工、风险清单和交付物清单。

## 验收标准
验收内容包括设备到货与安装质量、网络与供电条件、平台功能可用性、数据采集准确性、告警联动有效性、报表输出完整性、权限配置和资料移交。

## 运维响应
运维服务宜建立响应分级机制，覆盖远程支持、故障定位、现场处置、版本升级、设备巡检、数据备份和周期性运维报告。

## 资料归档
归档资料包括实施方案、点位表、设备清单、账号权限表、验收报告、培训签到与课件、运维联系人和系统操作手册。
"""
    write_text(CONTENT_DIR / "delivery" / "implementation-acceptance-ops.md", text)


def main() -> None:
    systems, domains = build_systems()
    media = build_media()
    platforms = build_platforms()
    solutions = build_solutions(systems)
    documents = build_documents()
    tags = build_tags(systems, solutions, platforms)
    relations = build_relations(solutions, systems, platforms)

    for solution in solutions:
        write_solution_markdown(solution, systems)
    write_delivery_content()

    site = {
        "name": "宇泛解决方案库",
        "subtitle": "AI数智建设综合方案、平台产品、子系统、资料与素材统一管理",
        "organization": "宇泛智能科技股份有限公司",
        "version": "0.1.0",
        "generatedAt": date.today().isoformat(),
        "githubPagesUrl": "https://jwu793230-debug.github.io/Temporary-display-URL/uni-solution-library/",
        "permissions": [
            {"id": "public", "name": "公开版", "description": "可用于对外展示的方案结构、产品介绍和通用能力。"},
            {"id": "internal", "name": "内部版", "description": "包含源材料登记、项目方法论和内部素材索引，不建议直接公开源文件。"},
            {"id": "customer", "name": "客户定制版", "description": "后续按客户、行业和项目范围生成的定制内容包。"},
        ],
        "stats": {
            "solutions": len(solutions),
            "platforms": len(platforms),
            "domains": len(domains),
            "systems": len(systems),
            "documents": len(documents),
            "media": len(media),
        },
        "navigation": [
            {"label": "方案总览", "href": "#solutions"},
            {"label": "平台产品", "href": "#platforms"},
            {"label": "子系统库", "href": "#systems"},
            {"label": "文档资料", "href": "#documents"},
            {"label": "素材库", "href": "#media"},
            {"label": "权限分级", "href": "#permissions"},
        ],
    }

    write_json(DATA_DIR / "site.json", site)
    write_json(DATA_DIR / "solutions.json", solutions)
    write_json(DATA_DIR / "platforms.json", platforms)
    write_json(DATA_DIR / "systems.json", systems)
    write_json(DATA_DIR / "domains.json", domains)
    write_json(DATA_DIR / "documents.json", documents)
    write_json(DATA_DIR / "media.json", media)
    write_json(DATA_DIR / "tags.json", tags)
    write_json(DATA_DIR / "relations.json", relations)
    print(f"Exported {len(solutions)} solutions, {len(platforms)} platforms, {len(systems)} systems, {len(media)} media records.")


if __name__ == "__main__":
    main()
