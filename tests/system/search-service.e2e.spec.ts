import { expect, test } from '@playwright/test';

const elasticBaseUrl = process.env.E2E_ELASTIC_BASE_URL || 'http://localhost:9200';
const searchBaseUrl = process.env.E2E_SEARCH_BASE_URL || 'http://localhost:8086/api/v1/search';
const seededDocId = 999001;

test.describe('search service e2e', () => {
  test('supports keyword, tag, and combined search with normalized Vietnamese input', async ({ request }) => {
    const payload = {
      id: seededDocId,
      title: 'Đề thi Toán chuyên E2E',
      searchTitle: 'de thi toan chuyen e2e',
      status: 'PUBLISHED',
      isPremium: false,
      tags: ['toan', 'dai so'],
    };

    const seedResponse = await request.put(
      `${elasticBaseUrl}/exams/_doc/${seededDocId}?refresh=true`,
      {
        data: payload,
        headers: { 'Content-Type': 'application/json' },
      },
    );
    expect(seedResponse.ok()).toBeTruthy();

    try {
      const tagOnly = await request.get(
        `${searchBaseUrl}/exams?tags=%C4%91%E1%BA%A1i%20s%E1%BB%91`,
      );
      expect(tagOnly.ok()).toBeTruthy();
      await expect.poll(async () => (await tagOnly.json()) as Array<{ id: number }>).toContainEqual(
        expect.objectContaining({ id: seededDocId }),
      );

      const keywordOnly = await request.get(
        `${searchBaseUrl}/exams?keyword=to%C3%A1n`,
      );
      expect(keywordOnly.ok()).toBeTruthy();
      expect(await keywordOnly.json()).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: seededDocId })]),
      );

      const combinedAccent = await request.get(
        `${searchBaseUrl}/exams?keyword=to%C3%A1n&tags=%C4%91%E1%BA%A1i%20s%E1%BB%91`,
      );
      expect(combinedAccent.ok()).toBeTruthy();
      expect(await combinedAccent.json()).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: seededDocId })]),
      );

      const combinedAscii = await request.get(
        `${searchBaseUrl}/exams?keyword=toan&tags=dai%20so`,
      );
      expect(combinedAscii.ok()).toBeTruthy();
      expect(await combinedAscii.json()).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: seededDocId })]),
      );
    } finally {
      await request.delete(`${elasticBaseUrl}/exams/_doc/${seededDocId}?refresh=true`);
    }
  });
});
