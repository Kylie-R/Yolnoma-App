use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartupApp {
    pub id: String,
    pub name: String,
    pub command: String,
    pub location: String,
    pub kind: String,
    pub enabled: bool,
    pub requires_admin: bool,
}

#[cfg(windows)]
mod windows_impl {
    use super::StartupApp;
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use std::path::{Path, PathBuf};
    use windows_sys::Win32::Foundation::ERROR_SUCCESS;
    use windows_sys::Win32::System::Registry::{
        HKEY, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, KEY_READ, KEY_WRITE, REG_EXPAND_SZ,
        REG_SZ, RegCloseKey, RegCreateKeyExW, RegDeleteValueW, RegEnumValueW, RegOpenKeyExW,
        RegQueryValueExW, RegSetValueExW,
    };

    const RUN_SUBKEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
    const DISABLED_SUBKEY: &str = r"Software\Microsoft\Windows\CurrentVersion\RunDisabled";
    const STARTUP_USER: &str = "User Startup folder";
    const STARTUP_COMMON: &str = "Common Startup folder";

    fn wide(value: &str) -> Vec<u16> {
        value.encode_utf16().chain(std::iter::once(0)).collect()
    }

    fn from_wide(buffer: &[u16]) -> String {
        let end = buffer.iter().position(|value| *value == 0).unwrap_or(buffer.len());
        OsString::from_wide(&buffer[..end]).to_string_lossy().into_owned()
    }

    fn from_registry_bytes(bytes: &[u8]) -> String {
        let units = bytes
            .chunks_exact(2)
            .map(|chunk| u16::from_ne_bytes([chunk[0], chunk[1]]))
            .collect::<Vec<_>>();
        from_wide(&units)
    }

    fn key_label(hive: HKEY) -> &'static str {
        if hive == HKEY_CURRENT_USER { "HKCU" } else { "HKLM" }
    }

    fn startup_id(kind: &str, location: &str, name: &str) -> String {
        format!("{}|{}|{}", kind, location, name)
    }

    unsafe fn open_key(hive: HKEY, subkey: &str, access: u32) -> Result<HKEY, String> {
        let mut key: HKEY = std::ptr::null_mut();
        let result = RegOpenKeyExW(hive, wide(subkey).as_ptr(), 0, access, &mut key);
        if result != ERROR_SUCCESS {
            return Err(format!("Registry key could not be opened (error {})", result));
        }
        Ok(key)
    }

    unsafe fn create_key(hive: HKEY, subkey: &str) -> Result<HKEY, String> {
        let mut key: HKEY = std::ptr::null_mut();
        let result = RegCreateKeyExW(
            hive,
            wide(subkey).as_ptr(),
            0,
            std::ptr::null_mut(),
            0,
            KEY_READ | KEY_WRITE,
            std::ptr::null(),
            &mut key,
            std::ptr::null_mut(),
        );
        if result != ERROR_SUCCESS {
            return Err(format!("Registry key could not be created (error {})", result));
        }
        Ok(key)
    }

    unsafe fn enumerate_registry(hive: HKEY) -> Vec<StartupApp> {
        let Ok(key) = open_key(hive, RUN_SUBKEY, KEY_READ) else { return Vec::new() };
        let mut apps = Vec::new();
        let mut index = 0;
        loop {
            let mut name = vec![0u16; 512];
            let mut name_len = name.len() as u32;
            let mut data = vec![0u8; 16 * 1024];
            let mut data_len = data.len() as u32;
            let mut value_type = 0u32;
            let result = RegEnumValueW(
                key,
                index,
                name.as_mut_ptr(),
                &mut name_len,
                std::ptr::null_mut(),
                &mut value_type,
                data.as_mut_ptr(),
                &mut data_len,
            );
            if result != ERROR_SUCCESS { break; }
            if value_type == REG_SZ || value_type == REG_EXPAND_SZ {
                let value_name = from_wide(&name[..name_len as usize]);
                let command = from_registry_bytes(&data[..data_len as usize]);
                let location = format!("{}\\{}", key_label(hive), RUN_SUBKEY);
                apps.push(StartupApp {
                    id: startup_id("registry", key_label(hive), &value_name),
                    name: value_name,
                    command,
                    location,
                    kind: "registry".to_string(),
                    enabled: true,
                    requires_admin: hive == HKEY_LOCAL_MACHINE,
                });
            }
            index += 1;
        }
        RegCloseKey(key);
        apps
    }

    unsafe fn enumerate_disabled(hive: HKEY) -> Vec<StartupApp> {
        let Ok(key) = open_key(hive, DISABLED_SUBKEY, KEY_READ) else { return Vec::new() };
        let mut apps = Vec::new();
        let mut index = 0;
        loop {
            let mut name = vec![0u16; 512];
            let mut name_len = name.len() as u32;
            let mut data = vec![0u8; 16 * 1024];
            let mut data_len = data.len() as u32;
            let mut value_type = 0u32;
            let result = RegEnumValueW(
                key,
                index,
                name.as_mut_ptr(),
                &mut name_len,
                std::ptr::null_mut(),
                &mut value_type,
                data.as_mut_ptr(),
                &mut data_len,
            );
            if result != ERROR_SUCCESS { break; }
            if value_type == REG_SZ || value_type == REG_EXPAND_SZ {
                let value_name = from_wide(&name[..name_len as usize]);
                let command = from_registry_bytes(&data[..data_len as usize]);
                apps.push(StartupApp {
                    id: startup_id("registry-disabled", key_label(hive), &value_name),
                    name: value_name,
                    command,
                    location: format!("{}\\{}", key_label(hive), DISABLED_SUBKEY),
                    kind: "registry".to_string(),
                    enabled: false,
                    requires_admin: hive == HKEY_LOCAL_MACHINE,
                });
            }
            index += 1;
        }
        RegCloseKey(key);
        apps
    }

    fn startup_dirs() -> Vec<(&'static str, PathBuf, bool)> {
        let mut dirs = Vec::new();
        if let Ok(app_data) = std::env::var("APPDATA") {
            dirs.push((STARTUP_USER, PathBuf::from(app_data).join(r"Microsoft\Windows\Start Menu\Programs\Startup"), false));
        }
        if let Ok(program_data) = std::env::var("ProgramData") {
            dirs.push((STARTUP_COMMON, PathBuf::from(program_data).join(r"Microsoft\Windows\Start Menu\Programs\Startup"), true));
        }
        dirs
    }

    fn is_startup_file(path: &Path) -> bool {
        let extension = path.extension().and_then(|ext| ext.to_str()).map(|ext| ext.to_ascii_lowercase());
        matches!(extension.as_deref(), Some("lnk" | "url" | "exe" | "bat" | "cmd" | "vbs" | "ps1"))
            || path.file_name().and_then(|name| name.to_str()).map(|name| {
                let original = name.strip_suffix(".disabled").unwrap_or_default();
                let extension = Path::new(original).extension().and_then(|ext| ext.to_str()).unwrap_or_default().to_ascii_lowercase();
                matches!(extension.as_str(), "lnk" | "url" | "exe" | "bat" | "cmd" | "vbs" | "ps1")
            }).unwrap_or(false)
    }

    fn folder_apps() -> Vec<StartupApp> {
        let mut apps = Vec::new();
        for (location, directory, requires_admin) in startup_dirs() {
            let Ok(entries) = std::fs::read_dir(&directory) else { continue };
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_file() || !is_startup_file(&path) { continue; }
                let raw_name = path.file_name().and_then(|value| value.to_str()).unwrap_or_default();
                let disabled = raw_name.ends_with(".disabled");
                let name = if disabled { raw_name.trim_end_matches(".disabled") } else { raw_name }.to_string();
                apps.push(StartupApp {
                    id: startup_id(if disabled { "folder-disabled" } else { "folder" }, location, &name),
                    name,
                    command: path.to_string_lossy().into_owned(),
                    location: location.to_string(),
                    kind: "folder".to_string(),
                    enabled: !disabled,
                    requires_admin,
                });
            }
        }
        apps
    }

    pub fn list() -> Result<Vec<StartupApp>, String> {
        let mut apps = unsafe {
            let mut values = enumerate_registry(HKEY_CURRENT_USER);
            values.extend(enumerate_registry(HKEY_LOCAL_MACHINE));
            values.extend(enumerate_disabled(HKEY_CURRENT_USER));
            values.extend(enumerate_disabled(HKEY_LOCAL_MACHINE));
            values
        };
        apps.extend(folder_apps());
        apps.sort_by_key(|app| (!app.enabled, app.name.to_lowercase()));
        Ok(apps)
    }

    unsafe fn read_registry_value(hive: HKEY, subkey: &str, name: &str) -> Result<(u32, Vec<u8>), String> {
        let key = open_key(hive, subkey, KEY_READ)?;
        let mut value_type = 0u32;
        let mut size = 0u32;
        let result = RegQueryValueExW(key, wide(name).as_ptr(), std::ptr::null_mut(), &mut value_type, std::ptr::null_mut(), &mut size);
        if result != ERROR_SUCCESS { RegCloseKey(key); return Err(format!("Registry value could not be read (error {})", result)); }
        let mut data = vec![0u8; size as usize];
        let result = RegQueryValueExW(key, wide(name).as_ptr(), std::ptr::null_mut(), &mut value_type, data.as_mut_ptr(), &mut size);
        RegCloseKey(key);
        if result != ERROR_SUCCESS { return Err(format!("Registry value could not be read (error {})", result)); }
        data.truncate(size as usize);
        Ok((value_type, data))
    }

    unsafe fn move_registry_value(hive: HKEY, from: &str, to: &str, name: &str) -> Result<(), String> {
        let (value_type, data) = read_registry_value(hive, from, name)?;
        let target = create_key(hive, to)?;
        let result = RegSetValueExW(target, wide(name).as_ptr(), 0, value_type, data.as_ptr(), data.len() as u32);
        RegCloseKey(target);
        if result != ERROR_SUCCESS { return Err(format!("Registry value could not be written (error {})", result)); }
        let source = open_key(hive, from, KEY_WRITE)?;
        let result = RegDeleteValueW(source, wide(name).as_ptr());
        RegCloseKey(source);
        if result != ERROR_SUCCESS { return Err(format!("Registry value could not be removed (error {})", result)); }
        Ok(())
    }

    fn parse_id(id: &str) -> Result<(&str, &str, &str), String> {
        let mut parts = id.splitn(3, '|');
        let kind = parts.next().ok_or_else(|| "Invalid startup entry".to_string())?;
        let location = parts.next().ok_or_else(|| "Invalid startup entry".to_string())?;
        let name = parts.next().ok_or_else(|| "Invalid startup entry".to_string())?;
        Ok((kind, location, name))
    }

    pub fn set_enabled(id: &str, enabled: bool) -> Result<(), String> {
        let (kind, location, name) = parse_id(id)?;
        if kind == "folder" || kind == "folder-disabled" {
            let directory = startup_dirs().into_iter().find(|(label, _, _)| *label == location).map(|(_, path, requires_admin)| (path, requires_admin)).ok_or_else(|| "Unknown Startup folder".to_string())?;
            let (directory, requires_admin) = directory;
            let source = if enabled { directory.join(format!("{}.disabled", name)) } else { directory.join(name) };
            let target = if enabled { directory.join(name) } else { directory.join(format!("{}.disabled", name)) };
            if requires_admin && !source.exists() { return Err("Startup file was not found".to_string()); }
            std::fs::rename(source, target).map_err(|error| format!("Could not update Startup folder entry: {}", error))?;
            return Ok(());
        }
        let hive = match location { "HKCU" => HKEY_CURRENT_USER, "HKLM" => HKEY_LOCAL_MACHINE, _ => return Err("Unknown registry hive".to_string()) };
        let (from, to) = if enabled { (DISABLED_SUBKEY, RUN_SUBKEY) } else { (RUN_SUBKEY, DISABLED_SUBKEY) };
        unsafe { move_registry_value(hive, from, to, name) }
    }
}

#[cfg(windows)]
#[tauri::command]
pub fn list_startup_apps() -> Result<Vec<StartupApp>, String> {
    windows_impl::list()
}

#[cfg(windows)]
#[tauri::command]
pub fn set_startup_app_enabled(id: String, enabled: bool) -> Result<(), String> {
    windows_impl::set_enabled(&id, enabled)
}

#[cfg(not(windows))]
#[tauri::command]
pub fn list_startup_apps() -> Result<Vec<StartupApp>, String> {
    Err("Windows startup management is only available on Windows.".to_string())
}

#[cfg(not(windows))]
#[tauri::command]
pub fn set_startup_app_enabled(_id: String, _enabled: bool) -> Result<(), String> {
    Err("Windows startup management is only available on Windows.".to_string())
}
