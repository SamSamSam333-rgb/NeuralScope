/* Course skeleton: areas, planned topics, glossary terms. Topic content lives in acad_d*.js. */
(function(){var NS=window.NS=window.NS||{};
var C=NS.course={areas:[],topics:[],terms:{}};
function A(id,t,planned){C.areas.push({id:id,t:t,planned:planned||[]});}
A('what','What AI Is');A('math','Math You Need',['Probability in plain words','Mean, variance and distributions']);
A('learn','How Machines Learn',['Regularisation','The bias-variance trade-off']);
A('classic','Classic Machine Learning',['Logistic regression','Principal component analysis']);
A('nn','Neural Networks',['Weight initialisation']);
A('vision','Computer Vision',['Image segmentation']);
A('seq','Sequences and RNNs');
A('llm','Transformers and Language Models',['Hallucination and grounding','Retrieval-augmented generation']);
A('gen','Generative AI',['What generative models are','GANs','Diffusion models','Prompting well','Evaluating generated output']);
A('eval','Evaluating Models',['ROC curves and AUC','Cross-validation','Comparing models fairly','Data leakage']);
A('resp','Responsible AI',['Bias and fairness','Explainability','Privacy and data rights','Safety and misuse','AI regulation basics']);
A('build','Building with AI',['Choosing a model','Data pipelines','Deploying a model','Monitoring in production','Cost and performance']);
A('work','AI in Your Work',['Where AI helps your job','Writing prompts for work','Automating a workflow','Checking AI output','Learning plan for your role','Talking to your team about AI']);
function T(id,area,t,level,mins,pre,o){o.id=id;o.area=area;o.t=t;o.level=level;o.mins=mins;o.pre=pre||[];C.topics.push(o);}
C.T=T;
var TERMS=[
['ai','Artificial intelligence (AI)','Software that does things we usually link with human thinking, such as recognising pictures, understanding language or making decisions.','what-ai'],
['ml','Machine learning (ML)','A way of building software where the program finds its own rules from examples instead of a person writing every rule.','ai-ml-dl'],
['dl','Deep learning','Machine learning that uses neural networks with many layers. It powers modern image, speech and language systems.','ai-ml-dl'],
['model','Model','The thing that gets trained: a set of numbers (parameters) plus a recipe for turning an input into an output.','what-ai'],
['data','Data','The examples a model learns from: pictures, text, tables of numbers, and so on.','data-features'],
['feature','Feature','One measurable property of an example, such as a pixel brightness, a house\'s area, or a word count.','data-features'],
['label','Label','The correct answer attached to an example during training, such as "cat" or "price = 40 lakh".','data-features'],
['dataset','Dataset','A collection of examples (and usually their labels) used to train and test a model.','data-features'],
['supervised','Supervised learning','Learning from examples that come with correct answers (labels).','kinds'],
['unsupervised','Unsupervised learning','Learning structure from data that has no labels, such as grouping similar items.','kinds'],
['rl','Reinforcement learning','Learning by trial and error: an agent acts, receives rewards or penalties, and learns which actions pay off.','kinds'],
['training','Training','The process of adjusting a model\'s parameters so its outputs get closer to the correct answers.','train-infer'],
['inference','Inference','Using an already trained model to make a prediction on new input. No learning happens.','train-infer'],
['parameter','Parameter','A number inside the model that training adjusts. Weights and biases are parameters.','neuron'],
['weight','Weight','A number that says how much one input matters to a neuron. Big weights mean a strong influence; negative weights push the other way.','neuron'],
['bias','Bias (the number)','A number a neuron adds to its total before deciding. It shifts how easily the neuron switches on. Not to be confused with unfair bias in data.','neuron'],
['neuron','Neuron (unit)','The basic building block of a neural network: it multiplies inputs by weights, adds a bias, and applies an activation function.','neuron'],
['activation','Activation function','A small function applied to a neuron\'s total, such as sigmoid, tanh or ReLU. It adds the bends that let networks learn complex patterns.','activation'],
['layer','Layer','A group of neurons that work side by side. Data flows through layers one after another.','layers'],
['forward','Forward pass','Sending an input through the network, layer by layer, to get an output.','layers'],
['loss','Loss','A single number measuring how wrong the model\'s predictions are. Training tries to make it small.','loss'],
['derivative','Derivative','How fast a quantity changes when you nudge another. Geometrically, the slope of a curve at a point.','calculus'],
['gradient','Gradient','The set of slopes of the loss with respect to every parameter. It points in the direction the loss rises fastest.','calculus'],
['gd','Gradient descent','Repeatedly moving parameters a small step opposite to the gradient so the loss goes down.','gd'],
['lr','Learning rate','How big each gradient descent step is. Too small is slow; too large overshoots.','gd'],
['epoch','Epoch','One full pass through the training data.','gd'],
['batch','Batch','A small group of examples used for one parameter update.','optim'],
['overfit','Overfitting','When a model memorises its training data and does badly on new data.','overfit'],
['underfit','Underfitting','When a model is too simple to capture the pattern, so it does badly even on training data.','overfit'],
['generalise','Generalisation','How well a model performs on data it has never seen.','overfit'],
['validation','Validation set','Data held back from training and used to check how well the model generalises.','split'],
['test','Test set','Data used only at the very end to report final performance honestly.','split'],
['backprop','Backpropagation','The method that works out the gradient for every weight by passing error backwards through the network.','backprop'],
['optimizer','Optimizer','The rule that turns gradients into parameter updates, for example SGD, Momentum or Adam.','optim'],
['vector','Vector','An ordered list of numbers. A point, a pixel colour or a word embedding can all be vectors.','vectors'],
['dot','Dot product','Multiply two vectors position by position and add the results. It measures how aligned they are.','vectors'],
['matrix','Matrix','A rectangular grid of numbers. Layers of a network are often written as matrix multiplications.','vectors'],
['cluster','Cluster','A group of data points that sit close together.','kmeans'],
['centroid','Centroid','The average position of all points in a cluster.','kmeans'],
['kmeans','K-means','A clustering algorithm: pick K centres, assign points to the nearest centre, move centres to the cluster average, repeat.','kmeans'],
['knn','K-nearest neighbours (KNN)','Classify a point by a vote among the K closest training points.','knn'],
['tree','Decision tree','A flowchart of yes/no questions about features that ends in a prediction.','tree'],
['gini','Gini impurity','A score of how mixed the classes are in a group. 0 means pure.','tree'],
['regression','Regression','Predicting a number (price, temperature) rather than a category.','linreg'],
['classification','Classification','Predicting a category (spam or not spam, cat or dog).','linreg'],
['pixel','Pixel','One dot of an image, stored as numbers for brightness or colour.','img-numbers'],
['filter','Filter (kernel)','A small grid of weights that slides over an image to detect a pattern such as an edge.','conv'],
['conv','Convolution','Sliding a filter over an input and recording the weighted sum at every position.','conv'],
['featuremap','Feature map','The output of applying a filter to the whole image: bright where the pattern appears.','conv'],
['pooling','Pooling','Shrinking a feature map by keeping, for example, the maximum of each small block.','cnn'],
['cnn','Convolutional neural network (CNN)','A network built from convolution layers. It is the standard design for image tasks.','cnn'],
['bbox','Bounding box','A rectangle that marks where an object is in an image.','detect'],
['confidence','Confidence score','A number from 0 to 1 for how strongly the model reacts. Not a guaranteed probability.','detect'],
['yolo','YOLO','"You Only Look Once": a fast object detector that predicts boxes and classes in a single pass over the image.','detect'],
['sequence','Sequence','Data where order matters, such as words in a sentence or readings over time.','seq-data'],
['rnn','Recurrent neural network (RNN)','A network that reads a sequence one step at a time and carries a memory (hidden state) from step to step.','rnn'],
['hidden','Hidden state','The memory vector an RNN passes from one step to the next.','rnn'],
['lstm','LSTM','An RNN variant with gates that decide what to remember and forget, so it handles longer sequences.','lstm'],
['token','Token','A small piece of text (a word or part of a word) that a language model reads as one unit.','tokens'],
['embedding','Embedding','A vector of numbers representing a token or item so that similar things sit close together.','tokens'],
['attention','Attention','A mechanism that lets each token look at all the others and weight how much each matters.','attention'],
['transformer','Transformer','A network architecture built on attention, used by modern language models.','transformer'],
['llm','Large language model (LLM)','A very large transformer trained to predict the next token in text.','llm'],
['softmax','Softmax','A function that turns a list of scores into probabilities that add up to 1.','llm'],
['temperature','Temperature','A setting that controls randomness when sampling: low is predictable, high is varied.','llm'],
['hallu','Hallucination','When a language model states something fluent but false.','llm'],
['precision','Precision','Of the items the model flagged as positive, the fraction that really were.','metrics'],
['recall','Recall','Of the items that really were positive, the fraction the model found.','metrics'],
['confusion','Confusion matrix','A table of true/false positives and negatives that shows exactly how a classifier errs.','metrics'],
['threshold','Threshold','The score above which the model says "positive". Moving it trades precision against recall.','metrics']];
TERMS.forEach(function(t){C.terms[t[0]]={t:t[1],d:t[2],first:t[3]};});
})();
