import unittest
from datetime import date, timedelta
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from weekly_review import build_weekly_training_reviews, coaching_messages, build_weekly_coach_html

def event(day, sport="Run", actual=60, planned=60, distance=5, **extra):
    return {"date": day, "type": sport, "actual_time": actual, "planned_time": planned, "actual_dist": distance, **extra}

class WeeklyReviewTests(unittest.TestCase):
    def test_minutes_sports_and_total(self):
        cache={"s":event("2026-09-28","Swim",30),"b":event("2026-09-29","Bike",90),"r":event("2026-09-30","Run",60),"other":event("2026-09-30","Strength",500)}
        r=build_weekly_training_reviews(cache,2026,date(2026,10,24))[40]
        self.assertEqual(r["hours"],{"swim":.5,"bike":1.5,"run":1.0,"total":3.0})
        self.assertEqual(r["sessions"],{"swim":1,"bike":1,"run":1})

    def test_no_data_is_not_zero(self):
        reviews=build_weekly_training_reviews({},2026,date(2026,10,24))
        self.assertEqual(len(reviews),52)
        self.assertTrue(all(v is None for v in reviews[1]["hours"].values()))
        self.assertIsNone(reviews[50]["hours"]["total"])
        self.assertTrue(reviews[50]["is_future"])

    def test_future_actual_excluded_and_current_partial(self):
        cache={"past":event("2026-10-20","Run",30,60),"future":event("2026-10-25","Run",200,60)}
        r=build_weekly_training_reviews(cache,2026,date(2026,10,24))[43]
        self.assertEqual(r["hours"]["total"],.5)
        self.assertEqual(r["planned_hours"]["total"],2)
        self.assertTrue(r["is_partial"])
        self.assertIsNone(r["trend_pct"])
        self.assertIn("本週進行中",coaching_messages(r)["summary"])

    def test_original_plan_and_iso_year(self):
        cache={"iso":event("2025-12-29","Run",60,10,original_plan={"planned_time":120}),"wrongyear":event("2025-01-01","Run",900,900)}
        r=build_weekly_training_reviews(cache,2026,date(2026,10,24))[1]
        self.assertEqual(r["hours"]["total"],1)
        self.assertEqual(r["planned_hours"]["total"],2)
        self.assertEqual(r["completion_pct"],50)

    def test_missing_time_never_shown_as_complete(self):
        r=build_weekly_training_reviews({"x":event("2026-09-28","Run",0,60,10)},2026,date(2026,10,24))[40]
        self.assertEqual(r["missing_time_count"],1)
        self.assertIsNone(r["hours"]["run"])
        self.assertIsNone(r["hours"]["total"])
        self.assertIsNone(r["completion_pct"])
        self.assertIn("缺少實際時間","".join(coaching_messages(r)["analysis"]))

    def test_prior_trend_no_lookahead(self):
        cache={}
        for week in [36,37,38,39,40]:
            cache[str(week)]=event(date.fromisocalendar(2026,week,2).isoformat(),"Run",60 if week<40 else 120)
        reviews=build_weekly_training_reviews(cache,2026,date(2026,10,24))
        self.assertEqual(reviews[40]["previous_four_mean_hours"],1)
        self.assertEqual(reviews[40]["trend_pct"],100)
        baseline=coaching_messages(reviews[40])
        cache["later"]=event("2026-10-06","Run",999)
        self.assertEqual(coaching_messages(build_weekly_training_reviews(cache,2026,date(2026,10,24))[40]),baseline)

    def test_week_specific_advice_and_safe_phase(self):
        cache={"a":event("2026-09-22","Swim",30,60),"b":event("2026-09-29","Bike",180,90)}
        reviews=build_weekly_training_reviews(cache,2026,date(2026,10,24))
        first=coaching_messages(reviews[39])
        second=coaching_messages(reviews[40],"Taper 1")
        self.assertNotEqual(first,second)
        self.assertTrue(any("減量" in x for x in second["advice"]))
        html=build_weekly_coach_html(reviews[40],"<img src=x>Taper")
        self.assertNotIn("<img",html)
        self.assertIn("W40",html)
        self.assertIn("騎車",html)

if __name__=="__main__":
    unittest.main()
