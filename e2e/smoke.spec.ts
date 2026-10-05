import { expect, test, type Page } from "@playwright/test";

async function answerCurrentQuestion(page: Page) {
  await expect(page.getByTestId("question-card")).toBeVisible();

  const answerChoices = page.getByTestId("answer-choice");
  const answerChoiceCount = await answerChoices.count();
  if (answerChoiceCount > 0) {
    await answerChoices
      .first()
      .evaluate((element) => (element as HTMLButtonElement).click());
    return;
  }

  const matchChoices = page.getByTestId("match-choice");
  const matchChoiceCount = await matchChoices.count();
  for (let index = 0; index < matchChoiceCount; index += 1) {
    await matchChoices
      .first()
      .evaluate((element) => (element as HTMLButtonElement).click());
  }
}

async function finishCurrentQuiz(page: Page) {
  for (let step = 0; step < 80; step += 1) {
    if (await page.getByTestId("results-summary").isVisible()) {
      return;
    }

    await answerCurrentQuestion(page);

    page.once("dialog", (dialog) => dialog.accept());
    const nextButton = page.getByTestId("next-question");
    await expect(nextButton).toBeEnabled();
    await nextButton.evaluate((element) =>
      (element as HTMLButtonElement).click(),
    );
    await page.waitForTimeout(50);
  }

  await expect(page.getByTestId("results-summary")).toBeVisible();
}

test("trivia quiz can be started and completed", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("start-trivia").click();

  await finishCurrentQuiz(page);

  await expect(page.getByTestId("results-summary")).toBeVisible();
});

test("academy quiz can be started and completed", async ({ page }) => {
  await page.goto("/academy");
  await page.getByTestId("academy-pack").first().click();
  await page.getByTestId("start-academy").click();

  await finishCurrentQuiz(page);

  await expect(page.getByTestId("results-summary")).toBeVisible();
});

test("consulting engagement can be started and completed", async ({ page }) => {
  await page.goto("/consulting");
  await page.getByTestId("engagement-option").first().click();
  await page.getByTestId("start-engagement").click();

  await finishCurrentQuiz(page);

  await expect(page.getByTestId("results-summary")).toBeVisible();
});
