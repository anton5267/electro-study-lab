import assert from "node:assert/strict";

import {
  EXAM_TICK_ACTIONS,
  buildStartedExamState,
  buildExamSnapshot,
  isRunningExam,
  resolveExamTickAction,
  resolveRuntimeRestoreAction,
  shouldAutoSubmitExam
} from "../assets/js/modules/exam-runtime.js";

{
  assert.equal(isRunningExam({ status: "running" }), true);
  assert.equal(isRunningExam({ status: "idle" }), false);
  assert.equal(isRunningExam(null), false);
}

{
  assert.equal(shouldAutoSubmitExam({ status: "running", endAt: 100 }, 100), true);
  assert.equal(shouldAutoSubmitExam({ status: "running", endAt: 101 }, 100), false);
  assert.equal(shouldAutoSubmitExam({ status: "idle", endAt: 50 }, 100), false);
}

{
  assert.equal(resolveExamTickAction({ status: "idle" }, 100), EXAM_TICK_ACTIONS.CLEAR_TIMER);
  assert.equal(resolveExamTickAction({ status: "running", endAt: 50 }, 100), EXAM_TICK_ACTIONS.SUBMIT_TIMEOUT);
  assert.equal(resolveExamTickAction({ status: "running", endAt: 150 }, 100), EXAM_TICK_ACTIONS.RENDER);
}

{
  function createRunningExamState(content, questionCount, durationMinutes, now, _shuffleArray, activeTopic) {
    return {
      status: "running",
      source: content.id,
      questionCount,
      durationMinutes,
      endAt: now + 1000,
      activeTopic,
      answers: {}
    };
  }

  const exam = buildStartedExamState(
    createRunningExamState,
    { id: "pack-1" },
    8,
    10,
    1_000,
    () => [],
    123,
    "switching"
  );

  assert.equal(exam.status, "running");
  assert.equal(exam.source, "pack-1");
  assert.equal(exam.activeTopic, "switching");
  assert.equal(exam.timerId, 123);
}

{
  assert.equal(buildStartedExamState(null), null);
}

{
  const snapshot = buildExamSnapshot({
    durationMinutes: 12,
    answers: {
      "qq-1": 2
    }
  });

  assert.equal(snapshot.durationMinutes, 12);
  assert.deepEqual(snapshot.answers, { "qq-1": 2 });
}

{
  const snapshot = buildExamSnapshot({
    durationMinutes: 0,
    answers: null
  });

  assert.equal(snapshot.durationMinutes, 1);
  assert.deepEqual(snapshot.answers, {});
}

{
  const snapshot = buildExamSnapshot({
    answers: {
      "qq-4": 1
    }
  });

  assert.equal(snapshot.durationMinutes, 10);
}

{
  assert.equal(resolveRuntimeRestoreAction({ status: "idle" }, 100), "persist");
  assert.equal(resolveRuntimeRestoreAction({ status: "running", endAt: 50 }, 100), "timeout");
  assert.equal(resolveRuntimeRestoreAction({ status: "running", endAt: 150 }, 100), "resume");
}

console.log("Exam runtime tests passed.");
