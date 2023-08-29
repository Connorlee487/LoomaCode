
#!pip install transformers
from transformers import AutoTokenizer, AutoModel
import torch
import pandas as pd
import io

def mean_pooling(token_embeddings, mask): # mean pooling 
    token_embeddings = token_embeddings.masked_fill(~mask[..., None].bool(), 0.)
    sentence_embeddings = token_embeddings.sum(dim=1) / mask.sum(dim=1)[..., None]
    return sentence_embeddings

activities = pd.read_csv('./activitesDN.csv') # read csv file

tokenizer = AutoTokenizer.from_pretrained('facebook/contriever') # Loads model <V
model = AutoModel.from_pretrained('facebook/contriever')

total_len = activities.shape[0] # Gets total length of data frame

cnt = total_len//1000 +1 # run each batch by 1000, gets total batches
batch=1000 
for i in range(cnt): # run #cnt of batches
    sub_len = i *1000 # gets starting index based on batch #
    if i==total_len//1000: # If statement for the last batch in case it doesn't have all 1000 values ex: batch 26 has only 92 values instead of 1000
        batch = total_len - sub_len
    inputs = tokenizer(activities[sub_len:sub_len + batch]['0'].astype(str).values.tolist(), padding=True, truncation=True, return_tensors='pt') # Use tokenizer
    outputs = model(**inputs) # Apply the model and get embeddings


    embeddings = mean_pooling(outputs[0], inputs['attention_mask']) # Embeddings

    embeddingsDN = []
    for x in range(len(embeddings)):
        embeddingsDN.append([activities.iloc[sub_len + x]['0'], embeddings[x]]) # Appends [Display name, Embedding] into new array

    pd.DataFrame(embeddingsDN).to_csv("./activitiesDN_Embeddings"+str(i)+".csv") # Writes all to new CSV with batch #
