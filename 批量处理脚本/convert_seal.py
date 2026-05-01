# convert_seal.py
import json
import re
import os

def parse_lua_table(filepath, root_key):
    """解析单个 Lua 文件，返回以数字 ID 为键的字典"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    data = {}
    current_id = None
    current_table = {}
    in_value_array = False
    value_array = []
    array_key = None

    for line in lines:
        line = line.strip()

        # 跳过空行和注释
        if not line or line.startswith('--'):
            continue

        # 匹配条目开始 [id] = {
        match_start = re.match(r'\[(\d+)\]\s*=\s*\{', line)
        if match_start:
            # 保存上一个条目
            if current_id is not None:
                data[current_id] = current_table
            current_id = int(match_start.group(1))
            current_table = {}
            in_value_array = False
            continue

        # 匹配条目结束 } 或 },
        if line.rstrip(',') == '}' or line.rstrip(',') == '},':
            if current_id is not None:
                # 处理未完成的 value 数组
                if in_value_array and array_key:
                    current_table[array_key] = value_array
                data[current_id] = current_table
                current_id = None
                current_table = {}
                in_value_array = False
                value_array = []
                array_key = None
            continue

        # 在条目内部匹配 key = value,
        # 处理普通键值对
        match_kv = re.match(r'(\w+)\s*=\s*(.+?),?$', line)
        if match_kv and not in_value_array:
            key = match_kv.group(1)
            value = match_kv.group(2).rstrip(',')

            # 处理数值
            if value.isdigit() or (value.startswith('-') and value[1:].isdigit()):
                current_table[key] = int(value)
            # 处理字符串 "xxxx"
            elif value.startswith('"') and value.endswith('"'):
                current_table[key] = value[1:-1]
            # 处理布尔值
            elif value == 'true':
                current_table[key] = True
            elif value == 'false':
                current_table[key] = False
            # 如果是 value = { 开始数组
            elif value == '{':
                in_value_array = True
                array_key = key
                value_array = []
            else:
                # 其他情况保留为字符串
                current_table[key] = value
            continue

        # 处理数组内部的字符串 "1:40000103:25"
        if in_value_array:
            match_arr_elem = re.match(r'"([^"]*)"', line)
            if match_arr_elem:
                value_array.append(match_arr_elem.group(1))
            continue

    # 文件最后可能没有闭合的 }
    if current_id is not None:
        if in_value_array and array_key:
            current_table[array_key] = value_array
        data[current_id] = current_table

    return data

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # 根据实际文件名修改，默认使用 .lua.lua 扩展名
    filenames = {
        'small_seals': 'BaseSeal.lua.lua',
        'big_level_up': 'BaseSealBigLevelUp.lua.lua',
        'big_quality_up': 'BaseSealBigQualityUp.lua.lua'
    }

    combined = {}
    for key, fname in filenames.items():
        filepath = os.path.join(base_dir, fname)
        if not os.path.exists(filepath):
            print(f"⚠️ 文件不存在: {fname}")
            continue
        print(f"解析 {fname} ...")
        data = parse_lua_table(filepath, key)
        combined[key] = data
        print(f"  条目数: {len(data)}")

    out_path = os.path.join(base_dir, 'data', 'seal_data.json')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
    print(f"✅ 已生成 {out_path}")

if __name__ == '__main__':
    main()