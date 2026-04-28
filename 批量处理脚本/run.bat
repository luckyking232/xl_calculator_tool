rem 1注释：关闭回显
@echo off
rem 3注释：切换路径到要执行的脚本文件目录位置
cd /d E:\Github_Projrect\XL\xl_calculator_tool\批量处理脚本
rem 4注释：执行python文件
python lua_to_json.py
rem 5注释：执行文件后，暂停
pause