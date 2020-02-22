# SWI Hackathon Text Analysis Version 1.1

library(tidyverse)
library(quanteda)
library(sentimentr)
library(csvread)
library(tidytext)

HomeDir <- "/Users/dboyle/Dropbox (Personal)/Hackathon/rdata/"
setwd(HomeDir)

mydata <- read_csv("dom-edits-burgerdienst.csv")

mydata <- mydata %>% 
  rownames_to_column(var = "rowname")

mydata$rowname <- as.numeric(mydata$rowname)

#### PARSE ENGLISH AND GERMAN TEXTS

library(spacyr)
# Initialize spaCy #
spacy_initialize(model = "de")

# Parse the text and makes a new tibble
mydata.de.dep <- spacy_parse(mydata$de_art, dependency = TRUE)

spacy_finalize()

spacy_initialize(model = "en")

# Parse the text and makes a new tibble
mydata.en.dep <- spacy_parse(mydata$en_art, dependency = TRUE)

spacy_finalize()

#Clean the tibble up a bit #####
mydata.de.dep$doc_id <- str_replace(mydata.de.dep$doc_id, "text", "")
mydata.de.dep$doc_id <- as.numeric(mydata.de.dep$doc_id)

mydata.en.dep$doc_id <- str_replace(mydata.en.dep$doc_id, "text", "")
mydata.en.dep$doc_id <- as.numeric(mydata.en.dep$doc_id)

mydata.de.dep <- mydata.de.dep %>% 
  rename(rowname = doc_id)

mydata.en.dep <- mydata.en.dep %>% 
  rename(rowname = doc_id)

mydata.de.dep$lemma <- tolower(mydata.de.dep$lemma)
mydata.en.dep$lemma <- tolower(mydata.en.dep$lemma)

####### FALSE FRIENDS
false_friends <- read_csv("false_friends.csv")

mydata.de.dep <- mydata.de.dep %>% 
  rename(de_lemma = lemma)

mydata.en.dep <- mydata.en.dep %>% 
  rename(en_lemma = lemma)

false_friends <- false_friends %>% 
  rename(en_lemma = en) %>% 
  rename(de_lemma = de)


ff_match <- false_friends %>% 
  left_join(mydata.de.dep, by = "de_lemma")

ff_match <- ff_match %>% 
  inner_join(mydata.en.dep, by = "en_lemma") %>% 
  group_by(rowname.x) %>% 
  summarise(count = n ())

ff_match <- ff_match %>% 
  rename(rowname = rowname.x) %>% 
  rename(ff_count = count) 

mydata <- mydata %>% 
  left_join(ff_match, by = "rowname") 


#####READABILITY



##### WORD COUNT

de_sentence_wc_tibble <- filter(mydata.de.dep, pos != "PUNCT") %>% # Filter out punctuation
  group_by(rowname) %>% 
  summarize(de_sentence_wc = n())

en_sentence_wc_tibble <- filter(mydata.en.dep, pos != "PUNCT") %>% # Filter out punctuation
  group_by(rowname) %>% 
  summarize(en_sentence_wc = n())

mydata <- mydata %>% 
  left_join(de_sentence_wc_tibble, by = "rowname") %>% 
  left_join(en_sentence_wc_tibble, by = "rowname") %>% 
  mutate(wc_diff = de_sentence_wc - en_sentence_wc)
  


##### Write to Disk
  
write_csv(mydata.de.dep, str_c(HomeDir, "de_dep.csv"))
write_csv(mydata.en.dep, str_c(HomeDir, "en_dep.csv"))

write_csv(mydata, str_c(HomeDir, "try3.csv"))
