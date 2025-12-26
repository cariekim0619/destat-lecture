import { expect } from "chai";
import { network } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";

interface Question {
  question: string;
  options: string[];
}

describe("SurveyFactory Contract", () => {
  let ethers: any;
  let factory: any;
  let owner: any;
  let respondent1: any;
  let respondent2: any;

  const minPoolAmount = "50";
  const minRewardAmount = "0.1";

  const title = "막무가내 설문조사";
  const description =
    "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한 자만 볼 수 있습니다.";
  const questions: Question[] = [
    {
      question: "누가 내 응답을 관리할 때 더 솔직할 수 있을까요?",
      options: [
        "구글폼 운영자",
        "탈중앙화된 블록체인 (관리주체 없으며 모든 데이터 공개)",
        "상관 없음",
      ],
    },
  ];

  beforeEach(async () => {
    ({ ethers } = await network.connect());
    [owner, respondent1, respondent2] = await ethers.getSigners();

    factory = await ethers.deployContract("SurveyFactory", [
      ethers.parseEther(minPoolAmount), // min_pool_amount
      ethers.parseEther(minRewardAmount), // min_reward_amount
    ]);
  });

  it("should deploy with correct minimum amounts", async () => {
    const minPoolStorage = await ethers.provider.getStorage(factory.target, 0);
    const minRewardStorage = await ethers.provider.getStorage(factory.target, 1);

    expect(BigInt(minPoolStorage)).eq(ethers.parseEther(minPoolAmount));
    expect(BigInt(minRewardStorage)).eq(ethers.parseEther(minRewardAmount));
  });

  it("should create a new survey when valid values are provided", async () => {
    const beforeLength = (await factory.getSurveys()).length;

    const tx = await factory
      .connect(owner)
      .createSurvey(
        { title, description, targetNumber: 100, questions },
        { value: ethers.parseEther("50") },
      );

    await expect(tx).to.emit(factory, "SurveyCreated").withArgs(anyValue);

    const afterLength = (await factory.getSurveys()).length;
    expect(afterLength).eq(beforeLength + 1);
  });

  it("should revert if pool amount is too small", async () => {
    await expect(
      factory
        .connect(owner)
        .createSurvey(
          { title, description, targetNumber: 100, questions },
          { value: ethers.parseEther("49") },
        ),
    ).to.be.revertedWith("Insufficient pool amount");
  });

  it("should revert if reward amount per respondent is too small", async () => {
    await expect(
      factory
        .connect(owner)
        .createSurvey(
          { title, description, targetNumber: 1000, questions },
          { value: ethers.parseEther("50") },
        ),
    ).to.be.revertedWith("Insufficient reward amount");
  });

  it("should store created surveys and return them from getSurveys", async () => {
    await factory
      .connect(respondent1)
      .createSurvey(
        { title: "survey-1", description, targetNumber: 100, questions },
        { value: ethers.parseEther("50") },
      )
      .then((tx: any) => tx.wait());

    await factory
      .connect(respondent2)
      .createSurvey(
        { title: "survey-2", description, targetNumber: 100, questions },
        { value: ethers.parseEther("50") },
      )
      .then((tx: any) => tx.wait());

    const surveys = await factory.getSurveys();
    expect(surveys.length).eq(2);
    expect(surveys[0]).not.eq(surveys[1]);
  });
});

