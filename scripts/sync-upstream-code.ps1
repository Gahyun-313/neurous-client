param(
    [string]$UpstreamRemote = "upstream",
    [string]$UpstreamBranch = "develop",
    [string]$PortfolioBranch = "develop",
    [string]$UpstreamUrl = "https://github.com/SWYP-app-3-10/neurous-client.git",
    [string]$CommitMessage = "chore: upstream develop 코드 선택 동기화",
    [switch]$Push
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [switch]$AllowFailure
    )

    & git @Arguments
    $exitCode = $LASTEXITCODE

    if (-not $AllowFailure -and $exitCode -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $exitCode"
    }

    return $exitCode
}

$repositoryRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repositoryRoot)) {
    throw "Git 저장소 안에서 실행해 주세요."
}

Push-Location $repositoryRoot

try {
    $currentBranch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $currentBranch -ne $PortfolioBranch) {
        throw "현재 브랜치가 '$PortfolioBranch'가 아닙니다. 현재 브랜치: '$currentBranch'"
    }

    $workingTreeStatus = (& git status --porcelain)
    if ($LASTEXITCODE -ne 0) {
        throw "작업 트리 상태를 확인하지 못했습니다."
    }
    if ($workingTreeStatus) {
        throw "커밋되지 않은 변경이 있습니다. 변경을 커밋하거나 보관한 뒤 다시 실행해 주세요."
    }

    & git remote get-url $UpstreamRemote *> $null
    if ($LASTEXITCODE -ne 0) {
        Invoke-Git -Arguments @("remote", "add", $UpstreamRemote, $UpstreamUrl) | Out-Null
        Write-Host "upstream remote를 추가했습니다: $UpstreamUrl"
    }

    Invoke-Git -Arguments @("fetch", $UpstreamRemote, $UpstreamBranch) | Out-Null

    & git merge-base --is-ancestor "$UpstreamRemote/$UpstreamBranch" HEAD
    if ($LASTEXITCODE -eq 0) {
        Write-Host "동기화할 새 upstream 코드가 없습니다."
        return
    }

    $portfolioHead = (& git rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "현재 커밋을 확인하지 못했습니다."
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupBranch = "archive/pre-code-sync-$timestamp"
    Invoke-Git -Arguments @("branch", $backupBranch, $portfolioHead) | Out-Null
    Write-Host "동기화 전 백업 브랜치를 만들었습니다: $backupBranch"

    if ($Push) {
        Invoke-Git -Arguments @("push", "origin", $backupBranch) | Out-Null
    }

    & git merge --no-commit --no-ff "$UpstreamRemote/$UpstreamBranch"
    $mergeExitCode = $LASTEXITCODE

    & git rev-parse --quiet --verify MERGE_HEAD *> $null
    $mergeInProgress = $LASTEXITCODE -eq 0
    if (-not $mergeInProgress) {
        throw "upstream 병합을 시작하지 못했습니다. git merge exit code: $mergeExitCode"
    }

    # upstream에서 README나 docs를 추가·수정·삭제해도 동기화 직전 개인 문서 상태로 되돌립니다.
    & git rm -r --quiet --ignore-unmatch -- README.md docs
    if ($LASTEXITCODE -ne 0) {
        throw "upstream 문서를 정리하지 못했습니다."
    }
    Invoke-Git -Arguments @("restore", "--source=$portfolioHead", "--staged", "--worktree", "--", "README.md", "docs") | Out-Null

    $unmergedFiles = @(& git diff --name-only --diff-filter=U)
    if ($LASTEXITCODE -ne 0) {
        throw "충돌 파일을 확인하지 못했습니다."
    }

    if ($unmergedFiles.Count -gt 0) {
        Write-Host "README.md와 docs는 개인 버전으로 보존했습니다."
        Write-Host "다음 코드 충돌을 해결한 뒤 커밋해 주세요:"
        $unmergedFiles | ForEach-Object { Write-Host "  - $_" }
        Write-Host "백업 브랜치: $backupBranch"
        exit 2
    }

    Invoke-Git -Arguments @("commit", "-m", $CommitMessage) | Out-Null

    if ($Push) {
        Invoke-Git -Arguments @("push", "origin", $PortfolioBranch) | Out-Null
    }

    Write-Host "upstream 코드를 동기화했습니다."
    Write-Host "개인 README와 docs는 동기화 전 상태로 유지했습니다."
    Write-Host "백업 브랜치: $backupBranch"
}
finally {
    Pop-Location
}
