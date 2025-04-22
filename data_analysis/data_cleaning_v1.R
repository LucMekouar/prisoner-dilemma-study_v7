# Load necessary library
library(tidyverse)

# Define the folder path
folder_path <- "/Users/lucmacbookpro-profile/Desktop/y3 project research/prisoner-dilemma-study_v7/data_analysis/data_2"

# Initialize an empty list to store participant data
all_participants_data <- list()

# Iterate over each file in the folder
for (file_name in list.files(folder_path, pattern = "\\.csv$", full.names = TRUE)) {
  # Read the CSV file
  data <- read_csv(file_name, show_col_types = FALSE)
  
  # Check if the file has at least 60 rows
  if (nrow(data) >= 60) {
    # Basic participant info
    id           <- length(all_participants_data) + 1
    consent      <- data$consent[2]
    age          <- data$age[3]
    gender       <- data$gender[3]
    group        <- data$group[1]
    group_num    <- ifelse(group == "communication_bot", 1, 0)
    total_payoff <- sum(data$participant_payoff, na.rm = TRUE)
    
    # Extract non‑practice rounds 1–30
    moves_data <- data %>%
      filter(!isPractice, !is.na(participant_move), participant_move != "") %>%
      select(round, participant_move, bot_move, matrix_number)
    
    # Named vectors for moves & matrices
    participant_move_vector <- setNames(
      moves_data$participant_move,
      paste0("participant_move_r", moves_data$round)
    )
    bot_move_vector <- setNames(
      moves_data$bot_move,
      paste0("bot_move_r", moves_data$round)
    )
    matrix_number_vector <- setNames(
      moves_data$matrix_number,
      paste0("matrix_number_r", moves_data$round)
    )
    
    # Build 30‑round message vector via row indices: row = 16 + 3*round
    message_vector <- setNames(rep("", 30), paste0("message_r", 1:30))
    if (group_num == 1) {
      for (r in moves_data$round) {
        row_idx <- 16 + 3 * r
        message_vector[[paste0("message_r", r)]] <-
          as.character(data$selected_question[row_idx])
      }
    }
    
    # Build 30‑round message_coop_score vector (NA or mapped score)
    score_map <- c(
      "Let's cooperate!"                                                          = 6,
      "I think we should cooperate to improve both our earnings."                 = 5,
      "Do you think we should cooperate?"                                         = 4,
      "What strategy should we use?"                                              = 3,
      "I do not know if I should cooperate as I do not know if you will cooperate." = 2,
      "There is no point in cooperating!"                                         = 1
    )
    message_score_vector <- setNames(rep(NA_integer_, 30), paste0("message_coop_score_r", 1:30))
    if (group_num == 1) {
      for (r in 1:30) {
        msg <- message_vector[[paste0("message_r", r)]]
        if (msg %in% names(score_map)) {
          message_score_vector[[paste0("message_coop_score_r", r)]] <- score_map[[msg]]
        }
      }
    }
    
    # Compute cooperation counts
    coop_count  <- sum(participant_move_vector == "A", na.rm = TRUE)
    coop_count1 <- sum(participant_move_vector[paste0("participant_move_r",  1:10)] == "A", na.rm = TRUE)
    coop_count2 <- sum(participant_move_vector[paste0("participant_move_r", 11:20)] == "A", na.rm = TRUE)
    coop_count3 <- sum(participant_move_vector[paste0("participant_move_r", 21:30)] == "A", na.rm = TRUE)
    
    # Compute communication_count: number of non-"No Selection" messages if communication_bot
    communication_count <- if (group_num == 1) {
      sum(message_vector != "No Selection")
    } else {
      NA_integer_
    }
    
    # Assemble into a tibble
    all_participants_data[[id]] <- tibble(
      id                   = id,
      consent              = consent,
      age                  = age,
      gender               = gender,
      group                = group,
      group_num            = group_num,
      total_payoff         = total_payoff,
      coop_count           = coop_count,
      coop_count1          = coop_count1,
      coop_count2          = coop_count2,
      coop_count3          = coop_count3,
      communication_count  = communication_count,
      
      !!!matrix_number_vector,
      !!!message_vector,
      !!!message_score_vector,
      !!!participant_move_vector,
      !!!bot_move_vector
    )
  }
}

# Combine all participant data into one data frame
combined_participants_data <- bind_rows(all_participants_data)

# Reorder columns: fixed info → coop counts → communication_count →
# then for r = 1..30: matrix_number_r, message_r, message_coop_score_r, participant_move_r, bot_move_r
round_cols <- unlist(lapply(1:30, function(r) {
  c(
    paste0("matrix_number_r",      r),
    paste0("message_r",            r),
    paste0("message_coop_score_r", r),
    paste0("participant_move_r",   r),
    paste0("bot_move_r",           r)
  )
}))

combined_participants_data <- combined_participants_data %>%
  select(
    id, consent, age, gender, group, group_num, total_payoff,
    coop_count, coop_count1, coop_count2, coop_count3,
    communication_count,
    all_of(round_cols)
  )

# Print the combined data frame
print(combined_participants_data)

# Summary stats
max_total_payoff <- max(combined_participants_data$total_payoff, na.rm = TRUE)
comm_bots        <- sum(combined_participants_data$group_num)
no_comm_bots     <- nrow(combined_participants_data) - comm_bots

cat("Maximum total payoff across all participants:", max_total_payoff, "\n")
cat("Count of participants in communication_bot condition:", comm_bots, "\n")
cat("Count of participants in no_com_bot condition:", no_comm_bots, "\n")

# Distribution of message_coop_score across all participants
all_scores <- unlist(combined_participants_data %>%
                       select(starts_with("message_coop_score_r")))
all_scores <- all_scores[!is.na(all_scores)]
score_dist <- sort(table(all_scores), decreasing = TRUE)
cat("\nDistribution of message_coop_score:\n")
for (s in names(score_dist)) {
  cat(score_dist[s], "message_coop_score of", s, "\n")
}

# Save to CSV (updated path)
output_file_path <- "/Users/lucmacbookpro-profile/Desktop/y3 project research/prisoner-dilemma-study_v7/data_analysis/combined_participants_data.csv"
write_csv(combined_participants_data, output_file_path)
