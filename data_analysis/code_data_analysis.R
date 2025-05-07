# Load necessary library
library(tidyverse)
library(dplyr)
library(ggplot2)
library(scales)
library(RColorBrewer)

# Define the folder path
folder_path <- "/Users/lucmacbookpro-profile/Desktop/y3 project research/prisoner-dilemma-study_v7/data_analysis/raw_data"

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
    
    # Extract non-practice rounds 1–30
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
    
    # Build 30-round message vector via row indices: row = 16 + 3*round
    message_vector <- setNames(rep("", 30), paste0("message_r", 1:30))
    if (group_num == 1) {
      for (r in moves_data$round) {
        row_idx <- 16 + 3 * r
        message_vector[[paste0("message_r", r)]] <-
          as.character(data$selected_question[row_idx])
      }
    }
    
    # Build 30-round message_coop_score vector (NA or mapped score)
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

# ---- t-tests for proportion of cooperation given previous round was cooperation/defection between the two conditions ----
# 1) Pivot to long once more
long_moves <- combined_participants_data %>%
  select(id, group_num, starts_with("participant_move_r")) %>%
  pivot_longer(
    cols         = starts_with("participant_move_r"),
    names_to     = "round",
    names_prefix = "participant_move_r",
    values_to    = "move"
  ) %>%
  mutate(round = as.integer(round)) %>%
  arrange(id, round)

# 2) Compute per‐subject p_i^C and p_i^D
cond_stats <- long_moves %>%
  group_by(id, group_num) %>%
  mutate(prev_move = lag(move)) %>%
  filter(!is.na(prev_move)) %>%
  summarise(
    p_i_C = if (sum(prev_move == "A") > 0)
      sum(prev_move == "A" & move == "A") / sum(prev_move == "A")
    else NA_real_,
    p_i_D = if (sum(prev_move == "B") > 0)
      sum(prev_move == "B" & move == "A") / sum(prev_move == "B")
    else NA_real_,
    .groups = "drop"
  )

# 3) Student’s t‐test (equal variances) on p_i^C
cat("=== stay-cooperate (p_i^C) by group — Student's t-test ===\n")
valid_C <- cond_stats %>% filter(!is.na(p_i_C))
print(table(valid_C$group_num))
if (n_distinct(valid_C$group_num) == 2) {
  tt_C_student <- t.test(p_i_C ~ group_num,
                         data     = valid_C,
                         var.equal = TRUE)
  print(tt_C_student)
} else {
  cat("Cannot run Student’s t-test for p_i^C: one group has no data.\n")
}

# 4) Student’s t‐test (equal variances) on p_i^D
cat("\n=== switch-to-cooperate (p_i^D) by group — Student's t-test ===\n")
valid_D <- cond_stats %>% filter(!is.na(p_i_D))
print(table(valid_D$group_num))
if (n_distinct(valid_D$group_num) == 2) {
  tt_D_student <- t.test(p_i_D ~ group_num,
                         data      = valid_D,
                         var.equal = TRUE)
  print(tt_D_student)
} else {
  cat("Cannot run Student’s t-test for p_i^D: one group has no data.\n")
}

# ---- full stacked‐area plot generation (most→least cooperation) ----
# 1) Define messages least→most cooperative
message_levels_asc <- c(
  "There is no point in cooperating!",
  "I do not know if I should cooperate as I do not know if you will cooperate.",
  "What strategy should we use?",
  "Do you think we should cooperate?",
  "I think we should cooperate to improve both our earnings.",
  "Let's cooperate!"
)

# 2) Pivot long
comm_long <- combined_participants_data %>%
  filter(group_num == 1) %>%
  select(starts_with("message_r")) %>%
  pivot_longer(
    cols         = everything(),
    names_to     = "round",
    names_prefix = "message_r",
    values_to    = "message"
  ) %>%
  mutate(
    round   = as.integer(round),
    message = factor(message, levels = message_levels_asc)
  )

# 3) Count per round × message
counts <- comm_long %>%
  group_by(round, message) %>%
  summarise(count = n(), .groups = "drop") %>%
  complete(round = 1:30, message = message_levels_asc, fill = list(count = 0))

# 4) Convert to percentages
pct <- counts %>%
  group_by(round) %>%
  mutate(
    percent = count / sum(count) * 100
  ) %>%
  ungroup()

# 5) Compute cumulative boundaries on percent scale
stacked_pct <- pct %>%
  group_by(round) %>%
  arrange(match(message, message_levels_asc), .by_group = TRUE) %>%
  mutate(
    ymin_pct = lag(cumsum(percent), default = 0),
    ymax_pct = cumsum(percent)
  ) %>%
  ungroup()

# 6) Palette (dark blue→dark red)
palette6 <- colorRampPalette(c("#313695", "#A50026"))(6)

# 7) Plot
p <- ggplot(stacked_pct, aes(x = round)) +
  geom_ribbon(aes(ymin = ymin_pct, ymax = ymax_pct, fill = message),
              color = "grey20", alpha = 0.7) +
  scale_x_continuous(breaks = seq(0, 30, by = 5)) +
  scale_y_continuous(
    labels = label_percent(scale = 1),
    expand = expansion(mult = c(0, .02))
  ) +
  scale_fill_manual(
    values = setNames(palette6, message_levels_asc),
    breaks = message_levels_asc,
    guide  = guide_legend(
      title   = "Message",
      reverse = TRUE
    )
  ) +
  labs(
    title = "Message Use Over 30 Rounds (Communication Group)",
    x     = "Round",
    y     = "% of Participants"
  ) +
  theme_bw(base_size = 14) +
  theme(
    panel.grid.minor = element_blank(),
    panel.grid.major = element_line(color = "grey80"),
    panel.background = element_rect(fill = "white", colour = NA),
    plot.background  = element_rect(fill = "white", colour = NA),
    legend.position  = "right",
    aspect.ratio     = 0.6
  )

# 8) Save
ggsave(
  filename = file.path(dirname(output_file_path), "message_stackplot_pct.png"),
  plot     = p,
  width    = 10,
  height   = 6,
  dpi      = 300
)

cat("Percentage-stacked plot saved to:",
    file.path(dirname(output_file_path), "message_stackplot_pct.png"), "\n")

# ---- Line plot of cooperation rate by group ----

# Pivot participant moves to long form
coop_long <- combined_participants_data %>%
  select(id, group_num, starts_with("participant_move_r")) %>%
  pivot_longer(
    cols         = starts_with("participant_move_r"),
    names_to     = "round",
    names_prefix = "participant_move_r",
    values_to    = "move"
  ) %>%
  mutate(round = as.integer(round))

# Compute percent cooperation by group and round
coop_rates <- coop_long %>%
  group_by(group_num, round) %>%
  summarise(
    percent_coop = mean(move == "A", na.rm = TRUE) * 100,
    .groups = "drop"
  )

# Define colors and shapes
group_colors <- c("0" = "#313695", "1" = "#A50026")
group_shapes <- c("0" = 16,         "1" = 17)

# Build the line plot
p2 <- ggplot(coop_rates, aes(x = round, y = percent_coop,
                             color = factor(group_num),
                             shape = factor(group_num))) +
  geom_line(size = 1) +
  geom_point(size = 3) +
  scale_color_manual(
    name   = "Group",
    labels = c("No communication", "Communication"),
    values = group_colors
  ) +
  scale_shape_manual(
    name   = "Group",
    labels = c("No communication", "Communication"),
    values = group_shapes
  ) +
  scale_x_continuous(breaks = seq(0, 30, by = 5)) +
  scale_y_continuous(
    labels = label_percent(scale = 1),
    limits = c(0, 100),
    expand = expansion(mult = c(0, 0.02))
  ) +
  labs(
    title = "Cooperation Rate Over 30 Rounds by Group",
    x     = "Round",
    y     = "% Cooperate"
  ) +
  theme_bw(base_size = 14) +
  theme(
    panel.grid.minor    = element_blank(),
    panel.grid.major    = element_line(color = "grey80"),
    panel.background    = element_rect(fill = "white", colour = NA),
    plot.background     = element_rect(fill = "white", colour = NA),
    legend.position     = "right",
    aspect.ratio        = 0.6
  )

# Save the plot alongside the CSV
img2_path <- file.path(dirname(output_file_path), "coop_rate_by_group.png")
ggsave(img2_path, plot = p2, width = 10, height = 6, dpi = 300)

cat("Cooperation‐rate line plot saved to:", img2_path, "\n")

# ---- mean cooperation between the two group, split the 30 rounds in 3 sets of 10 consecutive rounds ----

phase_stats <- coop_long %>%
  mutate(phase = case_when(
    round <= 10              ~ "first10",
    round >= 11 & round <= 20 ~ "mid10",
    TRUE                     ~ "last10"
  )) %>%
  group_by(id, group_num, phase) %>%
  summarise(
    mean_coop = mean(move == "A", na.rm = TRUE),
    .groups   = "drop"
  )

# loop over phases to run t-tests
for (ph in c("first10", "mid10", "last10")) {
  cat("\n=== Mean cooperation in", ph, "by group — t-test ===\n")
  data_ph <- filter(phase_stats, phase == ph)
  print(table(data_ph$group_num))
  tt <- t.test(mean_coop ~ group_num,
               data      = data_ph,
               var.equal = TRUE)
  print(tt)
}

# ---- mean cooperation between the two group, split the 30 rounds in 2 sets of 15 consecutive rounds ----

first_last_stats <- coop_long %>%
  mutate(phase = ifelse(round <= 15, "first15", "last15")) %>%
  group_by(id, group_num, phase) %>%
  summarise(
    mean_coop = mean(move == "A", na.rm = TRUE),
    .groups   = "drop"
  )

# Split out
first15_stats <- filter(first_last_stats, phase == "first15")
last15_stats  <- filter(first_last_stats, phase == "last15")

cat("\n=== Mean cooperation in rounds 1–15 by group — t-test ===\n")
print(table(first15_stats$group_num))
tt_first15 <- t.test(mean_coop ~ group_num,
                     data      = first15_stats,
                     var.equal = TRUE)
print(tt_first15)

cat("\n=== Mean cooperation in rounds 16–30 by group — t-test ===\n")
print(table(last15_stats$group_num))
tt_last15 <- t.test(mean_coop ~ group_num,
                    data      = last15_stats,
                    var.equal = TRUE)
print(tt_last15)

# ---- Dual Correlation Analyses & Plots ----

# A) Participant-level correlation -----------------------

# 1) Compute each participant’s overall ask_rate & coop_rate
comm_rates <- combined_participants_data %>%
  filter(group_num == 1) %>%
  rowwise() %>%
  mutate(
    ask_rate  = mean(c_across(starts_with("message_coop_score_r")) == 6, na.rm = TRUE),
    coop_rate = mean(c_across(starts_with("participant_move_r")) == "A", na.rm = TRUE)
  ) %>%
  ungroup() %>%
  select(id, ask_rate, coop_rate)

# 2) Scatter + regression line
p_part <- ggplot(comm_rates, aes(x = ask_rate, y = coop_rate)) +
  geom_point(size = 3, alpha = 0.7) +
  geom_smooth(method = "lm", se = TRUE) +
  scale_x_continuous(
    name   = "Participant Ask Rate\n(% of rounds saying “Let’s cooperate!”)",
    labels = scales::percent_format(1),
    limits = c(0, 1)
  ) +
  scale_y_continuous(
    name   = "Participant Cooperation Rate\n(% of rounds cooperating)",
    labels = scales::percent_format(1),
    limits = c(0, 1)
  ) +
  labs(title = "Participant-Level: Ask vs. Cooperation Rates") +
  theme_bw(base_size = 14) +
  theme(legend.position = "none")

# 3) Save
ggsave(
  filename = file.path(dirname(output_file_path), "participant_level_ask_vs_coop.png"),
  plot     = p_part,
  width    = 6, height = 6, dpi = 300
)
cat("Saved participant-level scatter to participant_level_ask_vs_coop.png\n")

# 4) Correlation test
cor_part <- cor.test(comm_rates$ask_rate, comm_rates$coop_rate)
print(cor_part)

# B) Round-level correlation -----------------------------

# 1) Build trial-level long_comm if you haven’t already
long_comm <- combined_participants_data %>%
  filter(group_num == 1) %>%
  pivot_longer(
    cols         = starts_with("participant_move_r"),
    names_to     = "round",
    names_prefix = "participant_move_r",
    values_to    = "move"
  ) %>%
  mutate(
    round     = as.integer(round),
    cooperate = as.integer(move == "A")
  ) %>%
  select(id, round, cooperate) %>%
  left_join(
    combined_participants_data %>%
      filter(group_num == 1) %>%
      pivot_longer(
        cols         = starts_with("message_coop_score_r"),
        names_to     = "round",
        names_prefix = "message_coop_score_r",
        values_to    = "score"
      ) %>%
      mutate(
        round = as.integer(round),
        ask   = as.integer(score == 6)
      ) %>%
      select(id, round, ask),
    by = c("id", "round")
  )

# 2) Compute per-round average rates
round_rates <- long_comm %>%
  group_by(round) %>%
  summarise(
    ask_rate  = mean(ask,       na.rm = TRUE),
    coop_rate = mean(cooperate, na.rm = TRUE),
    .groups   = "drop"
  )

# 3) Scatter + regression line
p_round <- ggplot(round_rates, aes(x = ask_rate, y = coop_rate)) +
  geom_point(size = 3, alpha = 0.7) +
  geom_smooth(method = "lm", se = TRUE) +
  scale_x_continuous(
    name   = "Round-Level Ask Rate\n(avg. % saying “Let’s cooperate!”)",
    labels = scales::percent_format(1),
    limits = c(0, 1)
  ) +
  scale_y_continuous(
    name   = "Round-Level Cooperation Rate\n(avg. % cooperating)",
    labels = scales::percent_format(1),
    limits = c(0, 1)
  ) +
  labs(title = "Round-Level: Ask vs. Cooperation Rates") +
  theme_bw(base_size = 14) +
  theme(legend.position = "none")

# 4) Save
ggsave(
  filename = file.path(dirname(output_file_path), "round_level_ask_vs_coop.png"),
  plot     = p_round,
  width    = 6, height = 6, dpi = 300
)
cat("Saved round-level scatter to round_level_ask_vs_coop.png\n")

# 5) Correlation test
cor_round <- cor.test(round_rates$ask_rate, round_rates$coop_rate)
print(cor_round)

# ---- Bar chart of overall mean cooperation by group ----

# 1) Compute overall mean cooperation, variance, and 95% CI for each group
summary_all <- coop_long %>%
  group_by(group_num) %>%
  summarise(
    mean_coop = mean(move == "A", na.rm = TRUE) * 100,
    var_coop  = var(as.numeric(move == "A"), na.rm = TRUE) * 100,
    n         = n(),
    sd        = sd(as.numeric(move == "A"), na.rm = TRUE) * 100,
    se        = sd / sqrt(n),
    ci        = qt(0.975, df = n - 1) * se,
    .groups   = "drop"
  ) %>%
  mutate(
    group_label = ifelse(group_num == 1, "Communication", "No communication")
  )

# Print your descriptive statistics
print(summary_all)

# 2) Build the bar plot
p_bar <- ggplot(summary_all, aes(x = group_label, y = mean_coop, fill = factor(group_num))) +
  geom_bar(stat = "identity", width = 0.6) +
  geom_errorbar(aes(ymin = mean_coop - ci, ymax = mean_coop + ci),
                width = 0.2, size = 0.8) +
  scale_fill_manual(values = group_colors, guide = FALSE) +
  scale_y_continuous(
    labels = label_percent(scale = 1),
    limits = c(0, 100),
    expand = expansion(mult = c(0, 0.02))
  ) +
  labs(
    title = "Mean Cooperation Over 30 Rounds by Group",
    x     = "Group",
    y     = "% Cooperation"
  ) +
  theme_bw(base_size = 14) +
  theme(
    panel.grid.minor = element_blank(),
    panel.grid.major = element_line(color = "grey80"),
    panel.background = element_rect(fill = "white", colour = NA),
    plot.background  = element_rect(fill = "white", colour = NA),
    aspect.ratio     = 0.6
  )

# 3) Save the bar chart alongside your other figures
bar_path <- file.path(dirname(output_file_path), "mean_coop_bar.png")
ggsave(filename = bar_path, plot = p_bar, width = 6, height = 6, dpi = 300)

cat("Bar chart of mean cooperation saved to:", bar_path, "\n")


# 1) Per‐participant overall cooperation
overall_stats <- coop_long %>%
  group_by(id, group_num) %>%
  summarise(mean_coop = mean(move == "A"), .groups = "drop")

# 2) Student’s t‐test (equal variances) on overall mean_coop
tt_all30 <- t.test(mean_coop ~ group_num,
                   data      = overall_stats,
                   var.equal = TRUE)
print(tt_all30)
