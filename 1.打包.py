import json
import time
import zipfile
from pathlib import Path

def collect_images(photo_dir, base_dir):
    """递归收集 img/photo 目录下所有文件的相对路径（相对于 base_dir）"""
    img_files = []
    photo_path = Path(photo_dir)
    base_path = Path(base_dir)
    
    if not photo_path.exists():
        print(f"警告: {photo_dir} 目录不存在")
        return img_files
    
    for file_path in photo_path.rglob('*'):
        if file_path.is_file():
            # 获取相对于 base_dir 的相对路径，并使用正斜杠
            relative_path = file_path.relative_to(base_path)
            rel_path = str(relative_path).replace('\\', '/')
            img_files.append(rel_path)
            print(f"已添加图片: {relative_path}")
    
    # 排序以保持一致性
    img_files.sort()
    return img_files

def load_and_validate_boot(boot_json_path, img_files):
    """只校验清单，不在打包时改写受版本控制的配置。"""
    with open(boot_json_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    if set(config['imgFileList']) != set(img_files):
        raise ValueError('boot.json 的图片清单与实际文件不一致')
    for key in ('styleFileList', 'scriptFileList', 'tweeFileList', 'imgFileList'):
        for relative_path in config.get(key, []):
            if not (boot_json_path.parent / relative_path).is_file():
                raise FileNotFoundError(relative_path)
    for addon in config.get('addonPlugin', []):
        if isinstance(addon.get('params'), list):
            for item in addon['params']:
                relative_path = item.get('replaceFile')
                if relative_path and not (boot_json_path.parent / relative_path).is_file():
                    raise FileNotFoundError(relative_path)
    return config

def create_zip(zip_name, base_dir):
    """
    将 base_dir 目录下的所有内容打包为 ZIP，保持目录结构。

    Args:
        zip_name (str): 生成的 ZIP 文件名
        base_dir (str): 要打包的根目录
    """
    base_path = Path(base_dir)
    if not base_path.exists() or not base_path.is_dir():
        print(f"错误: 基准目录不存在或不是目录 - {base_dir}")
        return

    try:
        with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # 递归遍历 base_dir 下的所有文件
            for file_path in base_path.rglob('*'):
                if file_path.is_file():
                    # 计算相对于 base_dir 的路径，并统一使用正斜杠
                    arcname = str(file_path.relative_to(base_path)).replace('\\', '/')
                    if any(part.startswith('.') for part in file_path.relative_to(base_path).parts):
                        continue
                    if 'copy' in arcname.lower() or arcname == 'test-smart-sort.js':
                        continue
                    zipf.write(file_path, arcname)
                    print(f"已添加: {arcname}")

        print(f"\n打包完成: {zip_name}")

    except Exception as e:
        print(f"打包 ZIP 失败: {e}")
        raise

def main():
    # 设置路径（假设脚本与这些文件在同一目录）
    base_dir = Path(__file__).parent / "Source"
    boot_json_path = base_dir / "boot.json"
    img_dir = base_dir / "img"
    
    # 1. 收集图片文件（使用相对路径）
    img_files = collect_images(img_dir, base_dir) + collect_images(base_dir / "guide", base_dir)
    
    # 2. 校验 boot.json，不修改源码
    config = load_and_validate_boot(boot_json_path, img_files)

    print("="*50)
    # 3. 获取版本号用于 ZIP 文件名
    version = config.get('version', 'unknown')
    zip_name = Path(__file__).parent / f"Dol-Optimization-v{version}.zip"
    print("version: ", version)
    print("filenam: ", zip_name)
    print("开始打包")
    print("="*50)

    # 4. 打包文件
    create_zip(zip_name, base_dir)
    with zipfile.ZipFile(zip_name) as archive:
        if archive.testzip() is not None or 'boot.json' not in archive.namelist():
            raise ValueError('安装包损坏或根目录缺少 boot.json')
    
    print("\n完成！")

if __name__ == "__main__":
    try:
        main()
        time.sleep(1)
    except Exception:
        print("="*50)
        import traceback
        traceback.print_exc()
        input()
