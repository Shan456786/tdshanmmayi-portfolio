/* LEETCODE
   snapshot: real figures read from the public profile on the date shown. Always labelled as a snapshot.
   liveUrl: once the daily GitHub Action has run successfully in the real repository AND the deployed site serves
   leetcode.json, set this to './leetcode.json' (the file written by scripts/leetcode-sync.mjs; keep the leading './'
   so it works from any hosting path). The card then loads it, checks it, shows
   when it was last updated, and falls back to this snapshot with an honest label if it can't be loaded.
   No credentials live in this page. maxStreak is LeetCode's "max streak" for the past year, never a current streak. */
export const LEETCODE = {
  user: 'ShanmayiShree',
  url: 'https://leetcode.com/u/ShanmayiShree/',
  liveUrl: '',   // stays empty until the GitHub Action has run successfully and the deployed site serves leetcode.json. Then set it to './leetcode.json'.
  refreshMinutes: 60,   // how often an open page re-reads leetcode.json. The file itself changes once a day.
  snapshot: {
    fetchedAt: '2026-11-24T13:35:52Z', solved: 254, easy: 78, medium: 135, hard: 41, submissions: 315, activeDays: 130, maxStreak: 77,
    badges: [{ name: '100 Days Badge 2026', date: '2026-11-05' }, { name: '50 Days Badge 2026', date: '2026-11-05' }, { name: 'Oct LeetCoding Challenge', date: '2026-10-31' }, { name: 'Sep LeetCoding Challenge', date: '2026-09-30' }, { name: 'Aug LeetCoding Challenge', date: '2026-08-31' }],
    calStart: '2026-07-17',
    cal: [3,5,20,32,21,29,11,10,5,7,12,2,5,2,4,2,2,2,2,3,3,8,2,2,3,2,1,1,2,1,2,3,2,1,1,2,1,1,1,1,1,3,1,1,1,1,2,1,1,1,1,1,1,0,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    recent: [
      { title: 'Maximum Subarray With Equal Products', slug: 'maximum-subarray-with-equal-products', ts: 1795500279 },
      { title: 'Product of the Last K Numbers', slug: 'product-of-the-last-k-numbers', ts: 1795414908 },
      { title: "Check if All A's Appears Before All B's", slug: 'check-if-all-as-appears-before-all-bs', ts: 1795327945 },
      { title: 'Find Subtree Sizes After Changes', slug: 'find-subtree-sizes-after-changes', ts: 1795265077 },
      { title: 'Maximize Consecutive Elements in an Array After Modification', slug: 'maximize-consecutive-elements-in-an-array-after-modification', ts: 1795167842 },
      { title: 'Minimum Score by Changing Two Elements', slug: 'minimum-score-by-changing-two-elements', ts: 1795102048 },
      { title: 'Minimum Number of Changes to Make Binary String Beautiful', slug: 'minimum-number-of-changes-to-make-binary-string-beautiful', ts: 1794982018 },
      { title: 'Minimum Changes to Make K Semi-palindromes', slug: 'minimum-changes-to-make-k-semi-palindromes', ts: 1794923077 },
      { title: 'Calculate Digit Sum of a String', slug: 'calculate-digit-sum-of-a-string', ts: 1794809204 },
      { title: 'Number of Sub-arrays With Odd Sum', slug: 'number-of-sub-arrays-with-odd-sum', ts: 1794722870 }
    ]
  }
};
