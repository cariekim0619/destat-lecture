import { expect } from "chai";
import { network } from "hardhat";

interface Question {
  question: string;
  options: string[];
}

describe("Survey init", () => {
  const ONE_ETHER = 10n ** 18n;
  const HUNDRED_ETHER = 100n * ONE_ETHER;

  const title = "막무가내 설문조사라면";
  const description =
    "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한자만 볼 수 있습니다.";
  const questions: Question[] = [
    {
      question: "누가 내 응답을 관리할때 더 솔직할 수 있을까요?",
      options: [
        "구글폼 운영자",
        "탈중앙화된 블록체인 (관리주체 없으며 모든 데이터 공개)",
        "상관없음",
      ],
    },
  ];

  const getSurveyContractAndEthers = async (survey: {
    title: string;
    description: string;
    targetNumber: number;
    questions: Question[];
    value?: bigint;
  }) => {
    const { ethers } = await network.connect();
    const { value, ...payload } = survey;
    const cSurvey = await ethers.deployContract(
      "Survey",
      [payload.title, payload.description, payload.targetNumber, payload.questions],
      { value: value ?? ethers.parseEther("100") },
    );
    return { ethers, cSurvey };
  };

  describe("Deployment", () => {
    it("should store survey info correctly", async () => {
      const { cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
      });

      expect(await cSurvey.title()).eq(title);
      expect(await cSurvey.description()).eq(description);
      expect(await cSurvey.targetNumber()).eq(100n);
    });

    it("should calculate rewardAmount correctly", async () => {
      const { cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
        value: HUNDRED_ETHER,
      });

      const expectedReward = HUNDRED_ETHER / 100n;
      expect(await cSurvey.rewardAmount()).eq(expectedReward);
    });
  });

  describe("Questions and Answers", () => {
    it("should return questions correctly", async () => {
      const { cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
      });

      const storedQuestions = await cSurvey.getQuestions();
      expect(storedQuestions.length).eq(questions.length);
      expect(storedQuestions[0].question).eq(questions[0].question);
      expect(storedQuestions[0].options).deep.eq(questions[0].options);
    });

    it("should allow valid answer submission", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
        value: HUNDRED_ETHER,
      });

      const [, respondent] = await ethers.getSigners();

      const submitTx = await cSurvey
        .connect(respondent)
        .submitAnswers({ respondent: respondent.address, answers: [1] });
      await submitTx.wait();

      const storedAnswers = await cSurvey.getAnswers();
      expect(storedAnswers.length).eq(1);
      expect(storedAnswers[0].respondent).eq(respondent.address);
      expect(storedAnswers[0].answers.map((a: bigint) => Number(a))).deep.eq([1]);
    });

    it("should revert if answer length mismatch", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
      });

      const [, respondent] = await ethers.getSigners();

      await expect(
        cSurvey
          .connect(respondent)
          .submitAnswers({ respondent: respondent.address, answers: [1, 2] }),
      ).to.be.revertedWith("Mismatched answers length");
    });

    it("should revert if target reached", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 1,
        questions,
        value: ONE_ETHER,
      });

      const [, respondent1, respondent2] = await ethers.getSigners();

      await cSurvey
        .connect(respondent1)
        .submitAnswers({ respondent: respondent1.address, answers: [1] })
        .then((tx: any) => tx.wait());

      await expect(
        cSurvey
          .connect(respondent2)
          .submitAnswers({ respondent: respondent2.address, answers: [1] }),
      ).to.be.revertedWith("This survey has been ended");
    });
  });

  describe("Rewards", () => {
    it("should pay correct reward to respondent", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        title,
        description,
        targetNumber: 100,
        questions,
        value: HUNDRED_ETHER,
      });

      const [, respondent] = await ethers.getSigners();
      const rewardAmount: bigint = await cSurvey.rewardAmount();

      const before = await ethers.provider.getBalance(respondent.address);

      const tx = await cSurvey
        .connect(respondent)
        .submitAnswers({ respondent: respondent.address, answers: [1] });
      const receipt = await tx.wait();

      const after = await ethers.provider.getBalance(respondent.address);
      expect(after).eq(before - receipt.fee + rewardAmount);
    });
  });
});
