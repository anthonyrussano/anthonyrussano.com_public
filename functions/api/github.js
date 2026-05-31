const USER_URL = "https://api.github.com/users/anthonyrussano";
const REPOS_URL =
  "https://api.github.com/users/anthonyrussano/repos?type=owner&sort=updated&per_page=100";
const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "anthonyrussano.com",
  "X-GitHub-Api-Version": "2022-11-28",
};
const SNAPSHOT = {
  publicRepos: 101,
  ownedRepos: 89,
  followers: 39,
  topLanguages: ["Python", "HTML", "Shell", "JavaScript"],
  source: "snapshot",
  refreshedAt: "2026-05-31T16:12:38.861Z",
};

function json(payload, options = {}) {
  return Response.json(payload, {
    ...options,
    headers: {
      "Cache-Control": "public, max-age=900",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...options.headers,
    },
  });
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(context.request.url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  let userResponse;
  let reposResponse;
  try {
    [userResponse, reposResponse] = await Promise.all([
      fetch(USER_URL, { headers: GITHUB_HEADERS }),
      fetch(REPOS_URL, { headers: GITHUB_HEADERS }),
    ]);
  } catch {
    return json(SNAPSHOT, { headers: { "Cache-Control": "public, max-age=300" } });
  }

  if (!userResponse.ok || !reposResponse.ok) {
    return json(SNAPSHOT, { headers: { "Cache-Control": "public, max-age=300" } });
  }

  const [user, repos] = await Promise.all([
    userResponse.json(),
    reposResponse.json(),
  ]);
  const ownedRepos = repos.filter((repo) => !repo.fork);
  const languages = ownedRepos.reduce((counts, repo) => {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] || 0) + 1;
    }
    return counts;
  }, {});
  const topLanguages = Object.entries(languages)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([language]) => language);

  const response = json({
    publicRepos: user.public_repos,
    ownedRepos: ownedRepos.length,
    followers: user.followers,
    topLanguages,
    source: "live",
    refreshedAt: new Date().toISOString(),
  });

  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
