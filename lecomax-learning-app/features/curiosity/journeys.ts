import { extraJourneys } from './journey-expansion';
import { subjectJourneys } from './subject-journeys';
export type LabKind =
  | 'lever'
  | 'lift'
  | 'solution'
  | 'population'
  | 'strata'
  | 'echo'
  | 'rotation'
  | 'gravity'
  | 'circuit'
  | 'heart'
  | 'engine'
  | 'memory'
  | 'threshold'
  | 'neuron'
  | 'data'
  | 'parallel'
  | 'training'
  | 'attention'
  | 'generation'
  | 'evaluation';
export type JourneyStep = {
  id: string;
  title: string;
  simple: string;
  deep: string;
  mechanism: string[];
  parts: { name: string; detail: string }[];
  lab: LabKind;
  mission: string;
  question: string;
  options: string[];
  correct: number;
  feedback: string;
  hint: string;
  source: string;
  sourceName: string;
};
export type Journey = { id: string; title: string; steps: JourneyStep[]; related: string[] };
const google = 'https://developers.google.com/machine-learning/crash-course/';
export const aiJourney: Journey = {
  id: 'ai',
  title: 'How Artificial Intelligence Works',
  related: ['gpu', 'attention', 'chips', 'brain'],
  steps: [
    {
      id: 'what-is-ai',
      title: 'What is artificial intelligence?',
      simple:
        'AI systems perform tasks such as recognizing patterns or generating text. A learned model adjusts numerical rules from examples; not all AI uses neural networks.',
      deep: 'Classification turns measurements into a category. A threshold is a simple decision rule. Changing it trades one kind of error against another; intelligence is not established by a confident output.',
      mechanism: [
        'Measure an input',
        'Apply a decision rule',
        'Compare the decision with the real outcome',
      ],
      parts: [
        { name: 'Input', detail: 'A measurement or representation supplied to the model.' },
        {
          name: 'Decision boundary',
          detail: 'Separates the cases assigned to different categories.',
        },
        { name: 'Evaluation', detail: 'Compares decisions with known outcomes.' },
      ],
      lab: 'threshold',
      mission: 'Set the threshold to 7. Observe how a score of 6 changes category.',
      question:
        'If a filter marks more messages as spam after lowering its threshold, what can also increase?',
      options: [
        'False alarms on legitimate messages',
        'The number of messages that existed',
        'Guaranteed accuracy',
      ],
      correct: 0,
      feedback:
        'A lower threshold accepts more cases as spam, including some legitimate messages. A decision rule must be evaluated against outcomes.',
      hint: 'Consider a legitimate message with a score close to the boundary.',
      source: google + 'classification/thresholding',
      sourceName: 'Google: Classification thresholds',
    },
    {
      id: 'neural-network',
      title: 'Inside a neural network',
      simple:
        'A mathematical neuron combines inputs with weights and a bias, then applies an activation function. Networks connect many such calculations.',
      deep: 'Here z = 2w + 1 and ReLU(z) = max(0,z). This is one unit, not a complete brain. Networks need nonlinear operations to represent many complex relationships.',
      mechanism: [
        'Multiply each input by its weight',
        'Add the bias',
        'Apply an activation',
        'Pass the result onward',
      ],
      parts: [
        { name: 'Weight', detail: 'Scales an input; training can change it.' },
        { name: 'Bias', detail: 'Offsets the weighted sum.' },
        {
          name: 'ReLU',
          detail: 'Outputs zero for a negative input and otherwise returns the input.',
        },
      ],
      lab: 'neuron',
      mission: 'Set weight to -1, then to 2. Compare the weighted sum with the activated output.',
      question: 'If the weighted sum is -3, what does ReLU output?',
      options: ['-3', '0', '3'],
      correct: 1,
      feedback:
        'ReLU clips negative values to zero. This nonlinearity changes which relationships a network can represent.',
      hint: 'ReLU chooses the larger of zero and the input.',
      source: google + 'neural-networks/nodes-hidden-layers',
      sourceName: 'Google: Nodes and hidden layers',
    },
    {
      id: 'training-data',
      title: 'What training data teaches',
      simple:
        'A model can only learn from the evidence provided. Repeating similar examples does not guarantee that unfamiliar cases will work well.',
      deep: 'Separate training, validation and test sets. Use validation to tune choices and reserve test data for evaluation. Duplicates and repeated test-driven tuning can make results misleading.',
      mechanism: [
        'Collect permitted examples',
        'Check coverage and duplicates',
        'Separate training from evaluation',
      ],
      parts: [
        { name: 'Training set', detail: 'Examples used to fit parameters.' },
        { name: 'Validation set', detail: 'Examples used to compare development choices.' },
        {
          name: 'Test set',
          detail:
            'Held-out examples for evaluation; repeatedly tuning against them weakens the test.',
        },
      ],
      lab: 'data',
      mission:
        'Move the number of class-A examples from 50 to 90. Observe the majority-only baseline.',
      question:
        'A model scores well because identical examples appear in training and test sets. What is the problem?',
      options: [
        'The test is too independent',
        'Information leakage makes the evaluation optimistic',
        'More duplicates always improve the test',
      ],
      correct: 1,
      feedback:
        'Duplicated examples let the evaluation reward memorization. Use independent, representative examples to test generalization.',
      hint: 'Ask whether the test case is actually new to the model.',
      source: google + 'overfitting/dividing-datasets',
      sourceName: 'Google: Dividing datasets',
    },
    {
      id: 'gpu',
      title: 'Why GPUs help',
      simple:
        'Many model calculations can run at the same time. GPUs provide substantial parallel computing capacity, but faster hardware cannot fix poor evidence.',
      deep: 'Independent arithmetic can be divided among workers. Dependencies, communication and memory access limit acceleration. This lab counts idealized rounds, not real GPU speed or a benchmark.',
      mechanism: [
        'Split independent calculations',
        'Run groups concurrently',
        'Combine the results',
      ],
      parts: [
        { name: 'Compute units', detail: 'Execute groups of operations.' },
        { name: 'Device memory', detail: 'Stores parameters and intermediate values.' },
        {
          name: 'Data transfers',
          detail: 'Moving information can consume time and limit useful speedup.',
        },
      ],
      lab: 'parallel',
      mission:
        'Increase workers to 4. Compare ideal rounds for 16 independent tasks with one worker.',
      question: 'Which workload gains least from adding parallel workers?',
      options: [
        'Many independent pixel operations',
        'A chain where every task needs the previous result',
        'Independent matrix elements',
      ],
      correct: 1,
      feedback:
        'A sequential dependency prevents those tasks from running together. More workers cannot remove that dependency.',
      hint: 'Can the next operation start before the previous one finishes?',
      source: 'https://docs.nvidia.com/cuda/cuda-c-programming-guide/',
      sourceName: 'NVIDIA: CUDA programming guide',
    },
    {
      id: 'training',
      title: 'Training changes parameters',
      simple:
        'Training compares predictions with targets and adjusts parameters to reduce a chosen error. An optimizer repeats this process.',
      deep: 'For this one-example model, prediction is 2w, target is 6, loss is (2w−6)² and gradient is 4(2w−6). The update is w ← w − 0.1 × gradient. Real training uses many examples and parameters.',
      mechanism: [
        'Predict',
        'Calculate loss',
        'Calculate a gradient',
        'Update the weight',
        'Evaluate on separate data',
      ],
      parts: [
        {
          name: 'Loss',
          detail:
            'A numerical objective; reducing it does not guarantee every real-world property.',
        },
        {
          name: 'Gradient',
          detail: 'The derivative indicates how this loss changes with the parameter.',
        },
        {
          name: 'Learning rate',
          detail: 'Controls update size; excessive steps can destabilize training.',
        },
      ],
      lab: 'training',
      mission:
        'Run at least three optimizer updates. Watch the weight approach 3 and the squared error shrink.',
      question:
        'Does reaching zero error on one training example prove that a model works on unseen examples?',
      options: [
        'Yes, one example proves everything',
        'No, generalization needs separate evaluation',
        'Only if the output is fluent',
      ],
      correct: 1,
      feedback:
        'Fitting a training example is evidence about that example. Generalization needs independent evaluation.',
      hint: 'Distinguish fitting from generalizing.',
      source: google + 'linear-regression/gradient-descent',
      sourceName: 'Google: Gradient descent',
    },
    {
      id: 'transformer',
      title: 'Transformers connect context',
      simple:
        'Attention mixes information from token representations. Learned scores determine how strongly each available position contributes.',
      deep: 'Queries and keys produce scores; softmax turns them into normalized weights, which combine value vectors. Real transformers include multiple heads, feed-forward layers and other operations.',
      mechanism: [
        'Create query, key and value representations',
        'Score available positions',
        'Normalize scores',
        'Mix values',
      ],
      parts: [
        { name: 'Query and key', detail: 'Their compatibility determines a score.' },
        { name: 'Value', detail: 'Information combined using the attention weights.' },
        {
          name: 'Mask',
          detail:
            'Restricts which positions are available, for example future tokens during causal training.',
        },
      ],
      lab: 'attention',
      mission: 'Increase the second token score to 3. Observe how both normalized weights change.',
      question:
        'If one attention weight increases in this two-token normalized example, what happens to the other?',
      options: ['It also increases', 'It decreases so the total stays 1', 'It becomes a word'],
      correct: 1,
      feedback:
        'The weights sum to one. Increasing one relative contribution decreases the other in this two-position example.',
      hint: 'Both shares must fit into one whole.',
      source: 'https://arxiv.org/abs/1706.03762',
      sourceName: 'Vaswani et al.: Attention Is All You Need (2017)',
    },
    {
      id: 'chatgpt',
      title: 'How a text response is generated',
      simple:
        'A language model generates text from the available context. Token-by-token generation is a useful simplified model; the surrounding product can also use tools.',
      deep: 'A prompt is represented as tokens, which can be word pieces. A model produces candidate continuations and generation selects from them. Our three candidates and scores are invented teaching values, not ChatGPT probabilities or its private implementation.',
      mechanism: [
        'Represent the prompt',
        'Compute candidate scores',
        'Select the next token',
        'Extend context and continue',
      ],
      parts: [
        {
          name: 'Context',
          detail: 'Instructions, conversation and supplied information affect the response.',
        },
        {
          name: 'Candidate distribution',
          detail: 'Possible continuations have different modeled probabilities.',
        },
        {
          name: 'Tools',
          detail:
            'A product may call external tools; text generation alone is not a live web search.',
        },
      ],
      lab: 'generation',
      mission:
        'Change temperature from 1 to 2 and compare the candidate probabilities. The candidates here are synthetic.',
      question: 'Does a high probability for a fluent continuation prove the claim is true?',
      options: [
        'No, plausibility is not factual verification',
        'Yes, probability is a citation',
        'Yes, every answer is a database lookup',
      ],
      correct: 0,
      feedback:
        'A plausible continuation can still be false. Verify factual claims with reliable evidence and distinguish tool results from generated text.',
      hint: 'Ask whether next-token likelihood measures truth.',
      source: 'https://developers.openai.com/api/docs/guides/text',
      sourceName: 'OpenAI: Text generation',
    },
    {
      id: 'evolution',
      title: 'How AI improves—and what remains uncertain',
      simple:
        'AI development involves better data, algorithms, hardware and evaluation. More impressive examples alone do not prove that a system improved on all tasks.',
      deep: 'Compare systems on tasks and populations relevant to their intended use. Fine-tuning changes behavior; evaluation must still examine errors. This lab uses invented group scores to show how an average can hide uneven performance.',
      mechanism: [
        'Define the task',
        'Measure independent outcomes',
        'Inspect subgroup errors',
        'Revise and test again',
      ],
      parts: [
        {
          name: 'Benchmark',
          detail: 'A defined evaluation; its scope limits what can be concluded.',
        },
        {
          name: 'Subgroup results',
          detail: 'Separate results may expose failures hidden by an aggregate.',
        },
        {
          name: 'Uncertainty',
          detail:
            'Unknown future capabilities and costs should not be presented as established facts.',
        },
      ],
      lab: 'evaluation',
      mission:
        'Change the share of group A to 90%. Observe the overall score while group B stays at 40%.',
      question:
        'An average rises because the evaluation includes more easy cases. What should you inspect?',
      options: ['Only the average', 'Group coverage and separate error rates', 'The system name'],
      correct: 1,
      feedback:
        'A changing evaluation mix can raise the aggregate without improving either group. Compare like with like and inspect subgroup results.',
      hint: 'Keep the group accuracies fixed and change only the proportions.',
      source: google + 'overfitting/dividing-datasets',
      sourceName: 'Google: Evaluation datasets',
    },
  ],
};
export const journeys: Journey[] = [aiJourney, ...extraJourneys, ...subjectJourneys];
export const getJourney = (id: string) => journeys.find((j) => j.id === id);
export const getStep = (topic: string, step: string) =>
  getJourney(topic)?.steps.find((s) => s.id === step);
