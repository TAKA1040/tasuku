param(
  [Parameter(Mandatory=$true)] [string]$ProjectDir,
  [Parameter(Mandatory=$true)] [int]$Port,
  [Parameter(ValueFromRemainingArguments=$true)] [string[]]$RestArgs
)

Write-Host ""
Write-Host "屏  local-dev.ps1 襍ｷ蜍・ -ForegroundColor Cyan
Write-Host "刀 ProjectDir :" $ProjectDir
Write-Host "倹 Port       :" $Port
if ($RestArgs.Count -gt 0) { Write-Host "筐・Extra Args :" ($RestArgs -join " ") }

# 1) 蜑肴署繝√ぉ繝・け
if (-not (Test-Path $ProjectDir)) {
  Write-Error "ProjectDir 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ: $ProjectDir"
  exit 1
}
Set-Location $ProjectDir

# 2) 繝代ャ繧ｱ繝ｼ繧ｸ繝槭ロ繝ｼ繧ｸ繝｣讀懷・
$pkgCmd = $null
if (Test-Path "$ProjectDir\pnpm-lock.yaml") { $pkgCmd = "pnpm" }
elseif (Test-Path "$ProjectDir\yarn.lock")   { $pkgCmd = "yarn" }
elseif (Test-Path "$ProjectDir\bun.lockb")   { $pkgCmd = "bun" }
elseif (Test-Path "$ProjectDir\package-lock.json") { $pkgCmd = "npm" }
else { $pkgCmd = "npm" }

Write-Host "逃 PackageMgr :" $pkgCmd

# 3) 繝昴・繝育ｩｺ縺咲｢ｺ隱搾ｼ・ｿ・ｦ√↑繧芽・蜍輔う繝ｳ繧ｯ繝ｪ繝｡繝ｳ繝茨ｼ域怙螟ｧ +10・・
function Test-PortFree([int]$p){
  $inUse = (Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue)
  return -not $inUse
}
$tryPort = $Port
$maxShift = 10
$shift = 0
while (-not (Test-PortFree $tryPort)) {
  $shift++
  if ($shift -gt $maxShift) {
    Write-Error "謖・ｮ壹・繝ｼ繝医′遨ｺ縺九★荳ｭ譁ｭ縺励∪縺励◆: $Port ~ $tryPort"
    exit 2
  }
  $tryPort++
}
if ($tryPort -ne $Port) {
  Write-Host ("WARNING: Port {0} is in use, switching to port {1}" -f $Port, $tryPort) -ForegroundColor Yellow
  $Port = $tryPort
}

# 4) 萓晏ｭ倥う繝ｳ繧ｹ繝医・繝ｫ・・ode_modules 縺檎┌縺代ｌ縺ｰ・・
if (-not (Test-Path "$ProjectDir\node_modules")) {
  Write-Host "筮・ 蛻晏屓繧ｻ繝・ヨ繧｢繝・・: 萓晏ｭ倥ｒ繧､繝ｳ繧ｹ繝医・繝ｫ荳ｭ..."
  switch ($pkgCmd) {
    "pnpm" { pnpm install }
    "yarn" { yarn install }
    "bun"  { bun install }
    default { npm install }
  }
}

# 5) 迺ｰ蠅・､画焚繧偵・繝ｭ繧ｻ繧ｹ縺ｫ驕ｩ逕ｨ・・AT 蛛ｴ縺ｧ隱ｭ縺ｿ霎ｼ繧薙□蛟､繧ゆｿ晄戟・・
$env:PORT = "$Port"

# 6) 髢狗匱繧ｵ繝ｼ繝占ｵｷ蜍・
Write-Host ""
Write-Host ("笆ｶ  Dev Start on http://localhost:{0}" -f $Port) -ForegroundColor Green

$devCmd = $null
switch ($pkgCmd) {
  "pnpm" { $devCmd = "pnpm dev --port $Port " + ($RestArgs -join " ") }
  "yarn" { $devCmd = "yarn dev --port $Port " + ($RestArgs -join " ") }
  "bun"  { $devCmd = "bun run dev -- --port $Port " + ($RestArgs -join " ") }
  default { $devCmd = "npm run dev -- --port $Port " + ($RestArgs -join " ") }
}

# npm scripts 縺檎┌縺・ｴ蜷医・ next 逶ｴ蜿ｩ縺阪・繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ
$packageJsonExists = Test-Path "$ProjectDir\package.json"
if (-not $packageJsonExists) {
  Write-Warning "package.json 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縲Ｏext 逶ｴ蜿ｩ縺阪↓繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ縺励∪縺吶・
  $devCmd = "npx next dev -p $Port " + ($RestArgs -join " ")
}

Write-Host "町 Exec: $devCmd"
# 螳溯｡・
cmd /c $devCmd
$exitCode = $LASTEXITCODE
Write-Host ""
Write-Host ("Exit code: {0}" -f $exitCode)
exit $exitCode
