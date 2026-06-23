export type HotTakeCategory =
  | "messi"
  | "modern"
  | "legends"
  | "nations"
  | "underdogs"
  | "chaos";

export interface HotTake {
  id: string;
  text: string;
  agreePercentage: number;
  category: HotTakeCategory;
}

const takes: readonly [string, number, HotTakeCategory][] = [
  ["Messi is the greatest World Cup player ever.", 76, "messi"],
  ["Ronaldo would trade club records for a World Cup medal.", 71, "chaos"],
  ["Mbappé will finish as the World Cup's all-time top scorer.", 68, "modern"],
  ["Neymar deserved a World Cup final more than most winners.", 58, "legends"],
  ["Lamine Yamal is already good enough to start a World Cup final.", 64, "modern"],
  ["Maradona had the single greatest World Cup tournament.", 72, "legends"],
  ["Pelé's legacy needs no defence from modern fans.", 81, "legends"],
  ["A World Cup matters more than the Champions League.", 79, "nations"],
  ["International football is more emotional than club football.", 74, "nations"],
  ["The best national teams should play more friendlies against underdogs.", 63, "underdogs"],
  ["France have more World Cup depth than any country right now.", 61, "modern"],
  ["Brazil should always play beautiful football, even if it costs results.", 67, "legends"],
  ["Argentina's 2022 win was the best World Cup final ever.", 69, "messi"],
  ["Germany will be a serious World Cup threat again.", 55, "nations"],
  ["England are judged more harshly than any other national team.", 65, "chaos"],
  ["Penalty shootouts are a perfect way to decide a knockout match.", 49, "chaos"],
  ["VAR has made World Cup football fairer overall.", 54, "modern"],
  ["Every World Cup should have an underdog in the semi-finals.", 83, "underdogs"],
  ["Croatia's 2018 run was more impressive than many title wins.", 56, "underdogs"],
  ["A great goalkeeper can carry a nation further than a great striker.", 57, "nations"],
  ["The Golden Ball should never go to a player from an eliminated team.", 52, "chaos"],
  ["Modern footballers are better athletes than past World Cup legends.", 62, "modern"],
  ["Past World Cup legends played in tougher conditions.", 66, "legends"],
  ["A manager matters more than a captain at the World Cup.", 45, "chaos"],
  ["South American teams bring more personality to the World Cup.", 59, "nations"],
  ["African teams are overdue a World Cup semi-final run.", 78, "underdogs"],
  ["Morocco proved a tactical underdog can change football history.", 74, "underdogs"],
  ["Portugal have underachieved with their generation of talent.", 69, "chaos"],
  ["Spain's possession era was more dominant than it was entertaining.", 51, "legends"],
  ["The Netherlands are the best nation never to win the World Cup.", 73, "nations"],
  ["A World Cup host should receive an automatic place.", 47, "chaos"],
  ["Expanding the World Cup makes group-stage games less special.", 56, "modern"],
  ["More nations makes the World Cup better.", 72, "underdogs"],
  ["Transfers should pause during a World Cup summer.", 61, "chaos"],
  ["Club form should matter less than tournament form in squad selection.", 64, "nations"],
  ["The best World Cup kits are as memorable as the matches.", 77, "legends"],
  ["A player can be a true great without winning a World Cup.", 82, "legends"],
  ["Mbappé is already France's greatest World Cup attacker.", 53, "modern"],
  ["Neymar is still one of football's most misunderstood stars.", 68, "chaos"],
  ["Messi's 2022 final was the best individual final performance.", 71, "messi"],
  ["Ronaldo's legacy would look different with a World Cup final.", 66, "chaos"],
  ["The best World Cup stories come from nations nobody expected.", 86, "underdogs"],
  ["A defensive masterclass can be as beautiful as a 4-3 thriller.", 58, "nations"],
  ["Managers should make substitutions earlier in knockout matches.", 63, "modern"],
  ["Golden generations usually disappoint because expectations are unfair.", 70, "chaos"],
  ["The 2010 Spain side would beat any modern national team.", 44, "legends"],
  ["Brazil versus Argentina is football's greatest international rivalry.", 75, "nations"],
  ["A World Cup winner should always be remembered over the best team.", 48, "chaos"],
  ["Underdogs should attack more, not just defend for penalties.", 62, "underdogs"],
  ["Football is better when players show personality on the pitch.", 84, "modern"],
  ["The next World Cup superstar will come from outside Europe.", 57, "underdogs"],
  ["National team loyalty is still one of football's best traditions.", 80, "nations"],
  ["A World Cup trophy changes how every great player is remembered.", 73, "legends"],
  ["The best managers build systems, not just superstar lineups.", 76, "modern"],
  ["World Cup pressure exposes players more than any club competition.", 78, "nations"],
  ["Chaos is the best part of knockout football.", 81, "chaos"],
  ["A surprise winner would make the next World Cup unforgettable.", 85, "underdogs"],
  ["The best era of football is the one you watched growing up.", 74, "legends"],
  ["A nation's style matters as much as winning the trophy.", 60, "nations"],
  ["The most controversial takes make football more fun.", 69, "chaos"],
];

export const HOT_TAKES: HotTake[] = takes.map(([text, agreePercentage, category], index) => ({
  id: `hot-take-${index + 1}`,
  text,
  agreePercentage,
  category,
}));
