use zed_extension_api::{self as zed, LanguageServerId, Result};

struct PoplarExtension;

impl zed::Extension for PoplarExtension {
    fn new() -> Self {
        PoplarExtension
    }

    // Gram starts `poplar lsp` from the PATH. The install script puts `poplar` there.
    fn language_server_command(
        &mut self,
        _language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let path = worktree.which("poplar").ok_or_else(|| {
            "poplar is not on the PATH. Install it: https://github.com/poplar-mc/poplar#install".to_string()
        })?;
        Ok(zed::Command {
            command: path,
            args: vec!["lsp".to_string()],
            env: Default::default(),
        })
    }
}

zed::register_extension!(PoplarExtension);
