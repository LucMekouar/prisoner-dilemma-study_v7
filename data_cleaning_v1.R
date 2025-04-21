# Load necessary library
library(tidyverse)

# Define the folder path
folder_path <- "/Users/lucmacbookpro-profile/Desktop/y3 project research/data"

# Initialize an empty list to store participant data
all_participants_data <- list()

# Iterate over each file in the folder
for (file_name in list.files(folder_path, pattern = "*.csv", full.names = TRUE)) {
  # Read the CSV file
  data <- read_csv(file_name)
  
  # Check if the file has at least 60 rows
  if (nrow(data) >= 60) {
    # Extract necessary information
    id <- length(all_participants_data) + 1
    consent <- data$consent[2]
    age <- data$age[3]
    gender <- data$gender[3]
    group <- data$group[1]
    group_num <- ifelse(group == "communication_bot", 1, 0)
    total_payoff <- sum(data$participant_payoff, na.rm = TRUE)
    
    # Extract participant moves, bot moves, and matrix numbers for non-practice rounds
    moves_data <- data %>%
      filter(!isPractice & !is.na(participant_move) & participant_move != "") %>%
      select(round, participant_move, bot_move, matrix_number)
    
    # Create named vectors for participant moves, bot moves, and matrix numbers
    participant_move_vector <- setNames(moves_data$participant_move, paste0("participant_move_r", moves_data$round))
    bot_move_vector <- setNames(moves_data$bot_move, paste0("bot_move_r", moves_data$round))
    matrix_number_vector <- setNames(moves_data$matrix_number, paste0("matrix_number_r", moves_data$round))
    
    # Count the number of 'A' in participant_move_r* columns
    coop_count <- sum(participant_move_vector == "A", na.rm = TRUE)
    
    # Append the participant data to the list
    all_participants_data <- append(all_participants_data, list(tibble(
      id = id,
      consent = consent,
      age = age,
      gender = gender,
      group = group,
      group_num = group_num,
      total_payoff = total_payoff,
      coop_count = coop_count,
      !!!participant_move_vector,
      !!!bot_move_vector,
      !!!matrix_number_vector
    )))
  }
}

# Combine all participant data into a single data frame
combined_participants_data <- bind_rows(all_participants_data)

# Reorder the columns at the end
combined_participants_data <- combined_participants_data %>%
  select(id, consent, age, gender, group, group_num, total_payoff, coop_count,
         matrix_number_r1, participant_move_r1, bot_move_r1,
         matrix_number_r2, participant_move_r2, bot_move_r2,
         matrix_number_r3, participant_move_r3, bot_move_r3,
         matrix_number_r4, participant_move_r4, bot_move_r4,
         matrix_number_r5, participant_move_r5, bot_move_r5,
         matrix_number_r6, participant_move_r6, bot_move_r6,
         matrix_number_r7, participant_move_r7, bot_move_r7,
         matrix_number_r8, participant_move_r8, bot_move_r8,
         matrix_number_r9, participant_move_r9, bot_move_r9,
         matrix_number_r10, participant_move_r10, bot_move_r10,
         matrix_number_r11, participant_move_r11, bot_move_r11,
         matrix_number_r12, participant_move_r12, bot_move_r12,
         matrix_number_r13, participant_move_r13, bot_move_r13,
         matrix_number_r14, participant_move_r14, bot_move_r14,
         matrix_number_r15, participant_move_r15, bot_move_r15,
         matrix_number_r16, participant_move_r16, bot_move_r16,
         matrix_number_r17, participant_move_r17, bot_move_r17,
         matrix_number_r18, participant_move_r18, bot_move_r18,
         matrix_number_r19, participant_move_r19, bot_move_r19,
         matrix_number_r20, participant_move_r20, bot_move_r20,
         matrix_number_r21, participant_move_r21, bot_move_r21,
         matrix_number_r22, participant_move_r22, bot_move_r22,
         matrix_number_r23, participant_move_r23, bot_move_r23,
         matrix_number_r24, participant_move_r24, bot_move_r24,
         matrix_number_r25, participant_move_r25, bot_move_r25,
         matrix_number_r26, participant_move_r26, bot_move_r26,
         matrix_number_r27, participant_move_r27, bot_move_r27,
         matrix_number_r28, participant_move_r28, bot_move_r28,
         matrix_number_r29, participant_move_r29, bot_move_r29,
         matrix_number_r30, participant_move_r30, bot_move_r30)

# Print the combined data frame
print(combined_participants_data)

# Output the maximum total_payoff across all participants
max_total_payoff <- max(combined_participants_data$total_payoff, na.rm = TRUE)
cat("Maximum total payoff across all participants:", max_total_payoff, "\n")

# Count participants in each group
communication_bot_count <- sum(combined_participants_data$group_num)
no_com_bot_count <- nrow(combined_participants_data) - communication_bot_count

# Print the counts
cat("Count of participants in communication_bot condition:", communication_bot_count, "\n")
cat("Count of participants in no_com_bot condition:", no_com_bot_count, "\n")

# Save the combined data frame to a CSV file
output_file_path <- "/Users/lucmacbookpro-profile/Desktop/y3 project research/combined_participants_data.csv"
write_csv(combined_participants_data, output_file_path)
