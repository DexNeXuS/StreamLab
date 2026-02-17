$b = [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
$names = @(
  'ollama','rocksmith','rocksmith-example','flash-sale','flash-sale-setup','flash-sale-example',
  'cmd-ctrl','cmd-ctrl-setup','cmd-ctrl-example','get-commands','get-commands-setup',
  'random-media-from-folder','random-media-setup','random-media-example',
  'touch-portal','touch-portal-setup','touch-portal-example',
  'html-widgets','html-widgets-setup','html-widgets-example',
  'twitch-hero','commands','streaming-rota','inventory','about','links','king-queen-example',
  'voicemeeter','voicemeeter-setup','voicemeeter-example','voicemod','voicemod-setup','voicemod-example',
  'streamelements','streamelements-setup','streamelements-example'
)
foreach ($n in $names) {
  [IO.File]::WriteAllBytes((Join-Path $PSScriptRoot ($n + '.png')), $b)
}
