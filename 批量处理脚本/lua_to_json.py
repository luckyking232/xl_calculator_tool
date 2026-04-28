import re
import json
import os
import csv
import sys

# ================== 常量映射 ==================
TYPE_MAPPING = {1: "坚甲", 2: "异刃", 4: "言灵", 5: "猎影"}
ELEMENT_MAPPING = {1: "水属性", 2: "火属性", 3: "木属性", 4: "暗属性", 5: "光属性"}

def extract_simple_block(text, key):
    """提取 key = { ... } 中的花括号内容（不嵌套）"""
    pattern = key + r'\s*=\s*\{(.*?)\}'
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else ""

def parse_attrs(attr_text):
    """
    解析 add_attr 里的属性列表，返回 {属性ID: 数值}
    支持 "1:属性ID:值" 和 "2:属性ID:值" 格式，但这里只保留 ID 和值，不区分操作符。
    """
    attrs = {}
    items = re.findall(r'"(\d):(\d+):(-?\d+)"', attr_text)
    for op, attr_id, val in items:
        val = int(val)
        # 直接以属性ID为键存储，不区分加算/乘算
        attrs[attr_id] = attrs.get(attr_id, 0) + val
    return attrs

# ================== 读取 CSV 获取角色名及技能描述 ==================
def load_csv_data(csv_path):
    """
    返回：
    name_map : id -> 中文名
    skill_desc_map : id -> {
        "passive_desc": [p1, p2, p3],
        "awake_desc": [a1, a2, a3, a4, a5]
    }
    """
    name_map = {}
    skill_desc_map = {}
    if not os.path.exists(csv_path):
        print(f"⚠ CSV 文件不存在: {csv_path}，将无法获取技能描述")
        return name_map, skill_desc_map

    with open(csv_path, newline='', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if not header:
            print("❌ CSV 表头为空")
            return name_map, skill_desc_map

        # 构建列名到索引的映射（去除前后空格，处理可能存在的 BOM）
        col_map = {}
        for i, col in enumerate(header):
            col = col.strip()
            col_map[col] = i

        # 检查必要列
        if 'ID' not in col_map or 'Name' not in col_map:
            print("❌ CSV 缺少 ID 或 Name 列")
            return name_map, skill_desc_map

        id_idx = col_map['ID']
        name_idx = col_map['Name']
        passive_cols = [col_map.get(f'Passive_Skill_{i}', -1) for i in range(1,4)]
        awake_cols = [col_map.get(f'觉醒{i}', -1) for i in range(1,6)]

        for row in reader:
            if not row or len(row) <= max(id_idx, name_idx):
                continue
            try:
                char_id = int(row[id_idx].strip())
                full_name = row[name_idx].strip()
                chinese_name = full_name.split('/')[0].strip()
                name_map[char_id] = chinese_name

                passives = [row[c] if c >= 0 and c < len(row) else "" for c in passive_cols]
                awakes = [row[c] if c >= 0 and c < len(row) else "" for c in awake_cols]
                skill_desc_map[char_id] = {
                    "passive_desc": passives,
                    "awake_desc": awakes
                }
            except (ValueError, IndexError):
                continue
    print(f"✅ 从 CSV 加载了 {len(name_map)} 个角色名称及技能描述")
    return name_map, skill_desc_map

# ================== 解析 BaseCard.lua ==================
def parse_base_card(filepath, name_map, skill_desc_map):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'\[(\d+)\]\s*=\s*(\{(?:[^{}]|(?:\{[^{}]*\}))*\})'
    matches = re.findall(pattern, content, re.DOTALL)

    characters = []
    for char_id_str, char_block in matches:
        char_id = int(char_id_str)

        name = name_map.get(char_id, f"角色{char_id}")
        # 基础属性提取（保留原始名称）
        def get_int(key):
            m = re.search(key + r'\s*=\s*(\d+)', char_block)
            return int(m.group(1)) if m else 0

        atk = get_int('atk')
        def_val = get_int('def')
        max_hp = get_int('max_hp')
        crt = get_int('crt')
        blk = get_int('blk')
        eva = get_int('eva')
        crt_int = get_int('crt_int')
        blk_int = get_int('blk_int')
        spd_move = get_int('spd_move')
        spd_atk = get_int('spd_atk')
        range_atk = get_int('range_atk')
        grow_model_id = get_int('grow_model_id')
        star = get_int('star')
        type_id = get_int('type')
        profession = TYPE_MAPPING.get(type_id, f"未知({type_id})")

        element_match = re.search(r'element_type\s*=\s*\{(\d+)\}', char_block)
        element = ELEMENT_MAPPING.get(int(element_match.group(1)), "") if element_match else ""

        # 提取技能 ID 列表
        def get_int_list(key):
            m = re.search(key + r'\s*=\s*\{([^}]*)\}', char_block)
            if m:
                return [int(x) for x in re.findall(r'\d+', m.group(1))]
            return []

        grow_skill_ids = get_int_list('grow_skill_ids')
        unlock_skill_ids = get_int_list('unlock_skill_ids')

        # 获取技能描述
        descs = skill_desc_map.get(char_id, {"passive_desc": ["","",""], "awake_desc": ["","","","",""]})
        passive_descs = descs["passive_desc"]
        awake_descs = descs["awake_desc"]

        characters.append({
            "id": char_id,
            "name": name,
            "star": star,
            "profession": profession,
            "element": element,
            "atk": atk,
            "def": def_val,
            "max_hp": max_hp,
            "crt": crt,
            "blk": blk,
            "eva": eva,
            "crt_int": crt_int,
            "blk_int": blk_int,
            "spd_move": spd_move,
            "spd_atk": spd_atk,
            "range_atk": range_atk,
            "grow_model_id": grow_model_id,
            "grow_skill_ids": grow_skill_ids,
            "unlock_skill_ids": unlock_skill_ids,
            "passive_skill_descs": passive_descs,
            "awakening_skill_descs": awake_descs
        })

    print(f"✅ 解析 BaseCard: {len(characters)} 个角色")
    return characters

# ================== 解析 BaseCardLevelUp.lua ==================
def parse_level_up(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    pattern = r'\[(\d+)\]\s*=\s*(\{(?:[^{}]|(?:\{[^{}]*\}))*\})'
    matches = re.findall(pattern, content, re.DOTALL)
    level_up = {}
    for id_str, block in matches:
        level_id = int(id_str)
        add_attr_text = extract_simple_block(block, "add_attr")
        attrs = parse_attrs(add_attr_text)
        # attrs 现在是 {属性ID: 数值}，例如 {"40000103": 912}
        level_up[level_id] = attrs
    print(f"✅ 解析 LevelUp: {len(level_up)} 条等级数据")
    return level_up

# ================== 解析 BaseCardQualityUp.lua ==================
def parse_quality_up(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    pattern = r'\[(\d+)\]\s*=\s*(\{(?:[^{}]|(?:\{[^{}]*\}))*\})'
    matches = re.findall(pattern, content, re.DOTALL)
    quality_up = {}
    for id_str, block in matches:
        q_id = int(id_str)
        add_attr_text = extract_simple_block(block, "add_attr")
        attrs = parse_attrs(add_attr_text)
        # 提取 card_level_max
        max_lv = re.search(r'card_level_max\s*=\s*(\d+)', block)
        attrs["max_total_level"] = int(max_lv.group(1)) if max_lv else 0
        quality_up[q_id] = attrs
    print(f"✅ 解析 QualityUp: {len(quality_up)} 条突破数据")
    return quality_up

# ================== 解析 BaseSkillLevelUp.lua ==================
def parse_skill_level_up(filepath):
    """
    返回：{ skill_level_id: { "add": {属性ID: 值}, "mult": {属性ID: 值} } }
    注意：加算和乘算分开存储，因为计算规则不同。
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    pattern = r'\[(\d+)\]\s*=\s*(\{(?:[^{}]|(?:\{[^{}]*\}))*\})'
    matches = re.findall(pattern, content, re.DOTALL)
    skill_dict = {}
    for id_str, block in matches:
        skill_level_id = int(id_str)
        add_match = re.search(r'add_attr\s*=\s*\{([^}]*)\}', block)
        if not add_match:
            continue
        add_content = add_match.group(1)
        # 分别提取加算(1)和乘算(2)
        items = re.findall(r'"(\d):(\d+):(-?\d+)"', add_content)
        add_attrs = {}
        mult_attrs = {}
        for op, attr_id, val in items:
            val = int(val)
            if op == '1':
                add_attrs[attr_id] = add_attrs.get(attr_id, 0) + val
            elif op == '2':
                mult_attrs[attr_id] = mult_attrs.get(attr_id, 0) + val
        if add_attrs or mult_attrs:
            skill_dict[skill_level_id] = {"add": add_attrs, "mult": mult_attrs}
    print(f"✅ 解析 SkillLevelUp: {len(skill_dict)} 条技能等级数据（有效加成）")
    return skill_dict

# ================== 主流程 ==================
def main():
    base_card_path = "BaseCard.lua.lua"
    level_up_path = "BaseCardLevelUp.lua.lua"
    quality_up_path = "BaseCardQualityUp.lua.lua"
    skill_level_up_path = "BaseSkillLevelUp.lua.lua"
    csv_path = "characters.csv"
    output_dir = r"E:\Github_Projrect\XL\xl_calculator_tool\data"

    for path in [base_card_path, level_up_path, quality_up_path, skill_level_up_path]:
        if not os.path.exists(path):
            print(f"❌ 找不到文件: {path}")
            sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    name_map, skill_desc_map = load_csv_data(csv_path)
    characters = parse_base_card(base_card_path, name_map, skill_desc_map)
    level_up = parse_level_up(level_up_path)
    quality_up = parse_quality_up(quality_up_path)
    skill_level_up = parse_skill_level_up(skill_level_up_path)

    with open(os.path.join(output_dir, "characters_base.json"), "w", encoding="utf-8") as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)
    with open(os.path.join(output_dir, "level_up.json"), "w", encoding="utf-8") as f:
        json.dump(level_up, f, ensure_ascii=False, indent=2)
    with open(os.path.join(output_dir, "quality_up.json"), "w", encoding="utf-8") as f:
        json.dump(quality_up, f, ensure_ascii=False, indent=2)
    with open(os.path.join(output_dir, "skill_level_up.json"), "w", encoding="utf-8") as f:
        json.dump(skill_level_up, f, ensure_ascii=False, indent=2)

    print("\n🎉 所有 JSON 文件已生成到", output_dir)

if __name__ == "__main__":
    main()